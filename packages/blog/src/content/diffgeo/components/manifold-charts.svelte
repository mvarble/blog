<script lang="ts">
    import { onDestroy } from 'svelte';
    import {
        AmbientLight,
        Mesh,
        MeshBasicMaterial,
        OrthographicCamera,
        PerspectiveCamera,
        PlaneGeometry,
        PointLight,
        Raycaster,
        Scene,
        SphereGeometry,
        SRGBColorSpace,
        TextureLoader,
        Vector2,
        Vector3,
        WebGLRenderer,
    } from 'three';
    import { OrbitControls } from 'three/examples/jsm/Addons.js';

    import NeedJavascript from '$lib/components/need-javascript.svelte';
    import { theme } from '$lib/state';
    import Katex from '$lib/components/katex.svelte';
    import {
        type Atlas,
        type Chart,
        chartTexture,
        loadAtlas,
        nearestOnChart,
    } from '../util/glb-manifold';
    import manifoldUrl from '../static/manifold.glb';
    import gridTexture from '../static/grid.png';

    // parameters (could be props)
    const aspect = 1.0;

    // The same green the arrow and the labels are drawn in.
    const MARKER = 0x46ae52;

    // The plane view frames the unit square with a little air around it. Charts
    // are shown at their true size and position within it rather than each being
    // zoomed to fill: the figure is about phi(U) being a *subset* of R^2, so a
    // small chart should look small.
    const MARGIN = 0.08;
    const LEFT = -MARGIN;
    const RIGHT = 1 + MARGIN;

    // constant resources
    const scene3d = new Scene();
    // Decay disabled so the intensity does not depend on how big the loaded
    // model turns out to be.
    const pointLight3d = new PointLight(0xffffff, 2.0, 0, 0);
    const ambientLight3d = new AmbientLight(0xffffff, 1.2);
    const camera3d = new PerspectiveCamera(50, aspect, 0.1, 500);
    const scene2d = new Scene();
    const ambientLight2d = new AmbientLight(0xffffff, 1);
    const camera2d = new OrthographicCamera(LEFT, RIGHT, RIGHT, LEFT);
    const raycaster = new Raycaster();

    scene3d.add(ambientLight3d);
    camera3d.add(pointLight3d);
    scene3d.add(camera3d);
    scene2d.add(ambientLight2d);
    scene2d.add(camera2d);

    // The plane itself, as a backdrop for the chart's image.
    const gridGeometry = new PlaneGeometry(1, 1).translate(0.5, 0.5, -0.001);
    const gridMaterial = new MeshBasicMaterial({ color: 0xfefefe });
    scene2d.add(new Mesh(gridGeometry, gridMaterial));

    // The point, in both views. Sized once the manifold's extent is known.
    const point3dGeometry = new SphereGeometry(1);
    const point3dMaterial = new MeshBasicMaterial({ color: MARKER });
    const point3d = new Mesh(point3dGeometry, point3dMaterial);
    point3d.visible = false;
    scene3d.add(point3d);

    const point2dGeometry = new SphereGeometry(0.018);
    const point2dMaterial = new MeshBasicMaterial({ color: MARKER });
    const point2d = new Mesh(point2dGeometry, point2dMaterial);
    point2d.visible = false;
    scene2d.add(point2d);

    // state
    let atlas: Atlas | undefined = $state(undefined);
    // How much nearer another chart has to be before it takes over the display.
    // Scaled to the model so that re-exporting it at a different size does not
    // silently change the behaviour; see `onmousemove3d`.
    let sameSurface = 0;
    let failure: string | undefined = $state(undefined);
    let chart: Chart | undefined = $state(undefined);

    // The last point shown, which doubles as the continuity hint that keeps the
    // marker on one branch where a chart's coordinates fold over themselves.
    const lastPoint = new Vector3();
    let hasPoint = false;

    let width3d: number | undefined = $state(undefined);
    let canvas3d: HTMLCanvasElement | undefined = $state(undefined);

    let canvas2d: HTMLCanvasElement | undefined = $state(undefined);
    let width2d: number | undefined = $state(undefined);

    let canvasMap: HTMLCanvasElement | undefined = $state(undefined);
    let widthMap: number | undefined = $state(undefined);
    let heightMap: number | undefined = $state(undefined);

    let textxMap: number = $state(0);
    let textyMap: number = $state(0);
    let textxManifold: number = $state(0);
    let textxPlane: number = $state(0);
    let labelSize: number = $state(48);

    // Load the atlas, frame the camera on it, and hand the charts' texture to
    // their flattened copies so both views show the same coordinate grid.
    $effect(() => {
        let stale = false;
        loadAtlas(manifoldUrl)
            .then((loaded) => {
                if (stale) {
                    loaded.dispose();
                    return;
                }
                for (const each of loaded.charts) {
                    each.surface.visible = false;
                    const map = chartTexture(each);
                    if (map) {
                        (each.domain.material as MeshBasicMaterial).map = map;
                        (each.domain.material as MeshBasicMaterial).needsUpdate = true;
                    }
                    scene2d.add(each.domain);
                    each.domain.visible = false;
                }
                scene3d.add(loaded.root);

                const radius = loaded.bounds.radius;
                sameSurface = 0.05 * radius;
                point3d.scale.setScalar(0.022 * radius);
                camera3d.near = radius / 100;
                camera3d.far = radius * 100;
                const distance = (radius * 1.05) / Math.sin((camera3d.fov * Math.PI) / 360);
                camera3d.position.copy(loaded.bounds.center).add(new Vector3(0, 0, distance));
                camera3d.updateProjectionMatrix();

                atlas = loaded;
            })
            .catch((error: unknown) => {
                failure = error instanceof Error ? error.message : String(error);
            });
        return () => {
            stale = true;
        };
    });

    // The plane's own grid, matching the other figure on this page.
    $effect(() => {
        new TextureLoader().loadAsync(gridTexture).then((map) => {
            map.colorSpace = SRGBColorSpace;
            gridMaterial.map = map;
            gridMaterial.needsUpdate = true;
        });
    });

    $effect(() => {
        gridMaterial.color.set(theme.current == 'dark' ? 0xc8c8c8 : 0xfefefe);
        gridMaterial.needsUpdate = true;
    });

    // Only one chart is drawn at a time, in both views.
    $effect(() => {
        if (!atlas) return;
        for (const each of atlas.charts) {
            each.surface.visible = each == chart;
            each.domain.visible = each == chart;
        }
    });

    $effect(() => {
        if (!canvas3d || !atlas) return;

        const renderer = new WebGLRenderer({ canvas: canvas3d, antialias: true });
        renderer.setClearAlpha(0.0);

        const orbitControls = new OrbitControls(camera3d, canvas3d);
        orbitControls.enablePan = false;
        orbitControls.enableZoom = false;
        orbitControls.target.copy(atlas.bounds.center);
        orbitControls.update();

        $effect(() => {
            if (!width3d) return;
            renderer.setSize(width3d, width3d / aspect);
        });

        renderer.setAnimationLoop(() => renderer.render(scene3d, camera3d));
        return () => {
            renderer.setAnimationLoop(null);
            orbitControls.dispose();
            renderer.dispose();
        };
    });

    $effect(() => {
        if (!canvas2d || !atlas) return;

        const renderer = new WebGLRenderer({ canvas: canvas2d, antialias: true });
        renderer.setClearAlpha(0.0);

        camera2d.position.set(0, 0, 1);
        camera2d.lookAt(0, 0, 0);

        $effect(() => {
            if (!width2d) return;
            renderer.setSize(width2d, width2d / aspect);
        });

        renderer.setAnimationLoop(() => renderer.render(scene2d, camera2d));
        return () => {
            renderer.setAnimationLoop(null);
            renderer.dispose();
        };
    });

    // The phi arrow drawn between the two canvases, and the placement of the
    // three labels around it.
    //
    // Every length here is a fraction of one canvas rather than a fixed number
    // of pixels. The two canvases always sit side by side and shrink together,
    // so the annotation has to shrink with them or it swamps the figure on a
    // narrow screen. At the widest the canvases get -- 500px each -- the
    // fractions reproduce the sizes this figure was originally drawn with.
    $effect(() => {
        if (!canvasMap || typeof widthMap == 'undefined' || typeof heightMap == 'undefined') return;
        if (!width3d) return;
        const unit = width3d;
        const r = 0.2 * unit;
        const d = 0.03 * unit;
        const e = 0.5;
        // Centred on the seam between the canvases, not on the container: the
        // content column can be wider than the two canvases at their 500px cap,
        // and the arrow belongs to the canvases.
        const cx = 0.5 * widthMap + 0.05 * unit;
        const cy = 0.5 * heightMap;
        const t0 = -Math.PI / 2.0 - 0.5;
        const t1 = -Math.PI / 2.0 + 0.5;
        const t = 0.5 * (t0 + t1);
        const c1 = Math.cos(t1);
        const s1 = Math.sin(t1);

        labelSize = 0.096 * unit;
        // The labels sit just inside the outer edge of each canvas.
        textxManifold = 0.5 * (widthMap - 2 * unit) + 0.12 * unit;
        textxPlane = widthMap - textxManifold - 1.25 * labelSize;
        textxMap = cx + r * Math.cos(t) - 0.42 * labelSize;
        textyMap = cy + r * Math.sin(t) - 1.15 * labelSize;
        const ctx = canvasMap.getContext('2d');
        canvasMap.width = widthMap;
        canvasMap.height = heightMap;
        if (!ctx) return;
        ctx.clearRect(0, 0, widthMap, heightMap);
        ctx.strokeStyle = 'currentColor';
        ctx.lineWidth = 1.5;
        ctx.arc(cx, cy, r, t0, t1);
        ctx.moveTo(cx + r * c1, cy + r * s1);
        ctx.lineTo(cx + r * c1 + d * s1 + e * d * c1, cy + r * s1 - d * c1 + e * d * s1);
        ctx.moveTo(cx + r * c1, cy + r * s1);
        ctx.lineTo(cx + r * c1 + d * s1 - e * d * c1, cy + r * s1 - d * c1 - e * d * s1);
        ctx.stroke();
    });

    onDestroy(() => {
        gridGeometry.dispose();
        gridMaterial.dispose();
        point3dGeometry.dispose();
        point3dMaterial.dispose();
        point2dGeometry.dispose();
        point2dMaterial.dispose();
        atlas?.dispose();
    });

    function ndc(e: MouseEvent, canvas: HTMLCanvasElement): Vector2 {
        const rect = canvas.getBoundingClientRect();
        return new Vector2(
            ((e.clientX - rect.left) / rect.width) * 2 - 1,
            -((e.clientY - rect.top) / rect.height) * 2 + 1,
        );
    }

    // Hovering the manifold shows a chart containing the point, and where that
    // point lands in the plane.
    //
    // Which chart, where several contain it, is decided by depth. Keeping
    // whichever chart the pointer is still inside is the behaviour that reads
    // best -- charts overlap heavily, and inside an overlap they are the same
    // surface, so ordering by depth alone is near arbitrary and the chart
    // flickers as the pointer sweeps. But "still inside" is not enough on its
    // own: the manifold has holes, so a chart can be under the pointer and yet
    // be on the far side of the surface, seen through one, which would leave the
    // shown chart stuck on the back while the pointer is plainly elsewhere.
    //
    // So the chart on show is kept unless another is *meaningfully* nearer. The
    // two cases are far apart and the threshold is not delicate: charts sharing
    // a patch of surface hit within a few hundredths of a unit of each other,
    // while a chart reached through a hole is several units further back.
    function onmousemove3d(e: MouseEvent) {
        if (!canvas3d || !atlas || e.buttons != 0) return;
        raycaster.setFromCamera(ndc(e, canvas3d), camera3d);
        const hits = raycaster.intersectObjects(
            atlas.charts.map((each) => each.surface),
            false,
        );
        if (hits.length == 0) return;

        const current = chart && hits.find((hit) => hit.object == chart!.surface);
        const keep = current && current.distance - hits[0].distance <= sameSurface;
        const hit = keep ? current : hits[0];
        chart = atlas.charts.find((each) => each.surface == hit.object);
        if (!hit.uv) return;

        point3d.position.copy(hit.point);
        point3d.visible = true;
        point2d.position.set(hit.uv.x, hit.uv.y, 0);
        point2d.visible = true;
        lastPoint.copy(hit.point);
        hasPoint = true;
    }

    // Hovering the plane traces the coordinate back onto the manifold. The
    // orthographic camera frames the unit square exactly, so the pointer gives
    // the coordinate directly -- no raycast needed on this side.
    function onmousemove2d(e: MouseEvent) {
        if (!canvas2d || !chart || e.buttons != 0) return;
        const pointer = ndc(e, canvas2d);
        const uv = new Vector2(
            LEFT + ((pointer.x + 1) / 2) * (RIGHT - LEFT),
            LEFT + ((pointer.y + 1) / 2) * (RIGHT - LEFT),
        );
        // Outside the chart's domain the nearest coordinate it does cover is
        // used instead, so the marker slides along the boundary rather than
        // vanishing as soon as the pointer leaves.
        const found = nearestOnChart(chart, uv, hasPoint ? lastPoint : undefined);
        if (!found) return;
        point3d.position.copy(found.point);
        point3d.visible = true;
        point2d.position.set(found.uv.x, found.uv.y, 0);
        point2d.visible = true;
        lastPoint.copy(found.point);
        hasPoint = true;
    }
</script>

{#snippet loading()}
    <blockquote class="blue">Loading the manifold...</blockquote>
{/snippet}

{#snippet failed()}
    The manifold could not be loaded. {failure}
{/snippet}

{#snippet success()}
    <div class="component" style:--label-size="{labelSize}px">
        <div class="canvas" bind:clientWidth={width3d}>
            <canvas bind:this={canvas3d} onmousemove={onmousemove3d}></canvas>
        </div>
        <div class="canvas" bind:clientWidth={width2d}>
            <canvas bind:this={canvas2d} onmousemove={onmousemove2d}></canvas>
        </div>
        <div class="map" bind:clientWidth={widthMap} bind:clientHeight={heightMap}>
            <canvas bind:this={canvasMap}></canvas>
        </div>
        <div class="text" style:left="{textxManifold}px" style:top="20px">
            <Katex latex="M" />
        </div>
        <div class="text" style:left="{textxPlane}px" style:top="20px">
            <Katex latex="\bbR^2" />
        </div>
        <div class="text" style:left="{textxMap}px" style:top="{textyMap}px">
            <Katex latex="\varphi" />
        </div>
    </div>
{/snippet}

<NeedJavascript
    isLoading={!atlas && !failure}
    isSuccess={!failure}
    {loading}
    {success}
    failure={failed}
/>

<style>
    .component {
        display: flex;
        align-items: center;
        /* Never stack. The manifold and its coordinate domain only say
           anything side by side, with the map between them, so on a narrow
           screen the pair scales down rather than breaking apart. */
        flex-wrap: nowrap;
        justify-content: center;
        position: relative;
        color: #46ae52;
    }
    .canvas {
        width: 50%;
        /* `min-width: auto` is the flex default and would refuse to shrink
           past the canvas's own size, forcing an overflow. */
        min-width: 0;
        max-width: 500px;
        flex-grow: 1;
        overflow: hidden;
    }
    .map {
        pointer-events: none;
        position: absolute;
        top: left;
        left: 0;
        width: 100%;
        height: 100%;
    }
    .text {
        pointer-events: none;
        position: absolute;
    }
    .text :global(.katex) {
        font-size: var(--label-size, 36pt) !important;
    }
    blockquote {
        text-align: center;
        background: hsl(210, 50%, 93%);
    }
    :global(html.dark) blockquote {
        background: hsl(210, 40%, 20%);
    }
</style>
