<script lang="ts">
    import { onDestroy } from 'svelte';
    import {
        Scene,
        PerspectiveCamera,
        WebGLRenderer,
        PointLight,
        AmbientLight,
        Mesh,
        MeshStandardMaterial,
        Raycaster,
        Vector2,
        Vector3,
        MeshBasicMaterial,
        SphereGeometry,
        OrthographicCamera,
        Object3D,
        SRGBColorSpace,
        TextureLoader,
        PlaneGeometry,
        Float32BufferAttribute,
    } from 'three';
    import { OrbitControls } from 'three/examples/jsm/Addons.js';

    import NeedJavascript from '$lib/components/need-javascript.svelte';
    import { theme } from '$lib/state';
    import Katex from '$lib/components/katex.svelte';
    import { Charts, torus, TORUS, type Chart } from '../util/torus';
    import gridTexture from '../static/grid.png';

    // parameters (could be props)
    const aspect = 1.0;

    // constant resources
    const scene3d = new Scene();
    const pointLight3d = new PointLight(0xffffff, 200);
    const ambientLight3d = new AmbientLight(0xffffff, 1);
    const camera3d = new PerspectiveCamera(50, aspect, 1, 20);
    const scene2d = new Scene();
    const ambientLight2d = new AmbientLight(0xffffff, 1);
    const camera2d = new OrthographicCamera(-3.0, 3.0, 3.0, -3.0);
    const raycaster = new Raycaster();
    const textureLoader = new TextureLoader();

    // initialization
    scene3d.add(ambientLight3d);
    camera3d.add(pointLight3d);
    scene3d.add(camera3d);
    scene2d.add(ambientLight2d);
    scene2d.add(camera2d);

    // Manifold
    const manifoldGeometry = torus();
    const manifoldMaterial = new MeshStandardMaterial({ color: 0x5e9cf7 });
    const manifold = new Mesh(manifoldGeometry, manifoldMaterial);
    scene3d.add(manifold);

    // Manifold charts
    const charts = new Charts();
    const chartsGeometry = charts.geometry3d;
    const chartsMaterial = new MeshBasicMaterial({ color: 0xe295f0 });
    scene3d.add(new Mesh(chartsGeometry, chartsMaterial));

    // Manifold point
    const point3dGeometry = new SphereGeometry(0.1);
    const point3dMaterial = new MeshBasicMaterial({ color: 0xff0000 });
    const point3d = new Mesh(point3dGeometry, point3dMaterial);
    scene3d.add(point3d);

    // Coordinate grid
    const gridGeometry = new PlaneGeometry(4, 4);
    gridGeometry.setAttribute('uv', new Float32BufferAttribute([0, 0, 1, 0, 0, 1, 1, 1], 2));
    const gridMaterial = new MeshBasicMaterial({ color: 0xfefefe });
    scene2d.add(new Mesh(gridGeometry, gridMaterial));

    // Coordinate domain
    const domainGeometry = charts.geometry2d;
    const domainMaterial = new MeshBasicMaterial({ color: 0xe295f0 });
    const domain = new Mesh(domainGeometry, domainMaterial);
    scene2d.add(domain);

    // Coordinate point
    const point2dGeometry = new SphereGeometry(0.1);
    const point2dMaterial = new MeshBasicMaterial({ color: 0xff0000 });
    const point2d = new Mesh(point2dGeometry, point2dMaterial);
    scene2d.add(point2d);

    // state
    let chart: Chart | undefined = $state(undefined);

    let width3d: number | undefined = $state(undefined);
    let canvas3d: HTMLCanvasElement | undefined = $state(undefined);

    let canvas2d: HTMLCanvasElement | undefined = $state(undefined);
    let width2d: number | undefined = $state(undefined);
    let hitPoint2d: Vector3 | undefined = $state(undefined);

    let canvasMap: HTMLCanvasElement | undefined = $state(undefined);
    let widthMap: number | undefined = $state(undefined);
    let heightMap: number | undefined = $state(undefined);

    let textxMap: number = $state(0);
    let textyMap: number = $state(0);

    let textxManifold: number = $state(0);
    let textxPlane: number = $state(0);

    // reactivity
    $effect(() => {
        textureLoader.loadAsync(gridTexture).then((map) => {
            map.colorSpace = SRGBColorSpace;
            chartsMaterial.map = map;
            chartsMaterial.needsUpdate = true;
            domainMaterial.map = map;
            domainMaterial.needsUpdate = true;
            gridMaterial.map = map;
            gridMaterial.needsUpdate = true;
        });
    });

    $effect(() => {
        if (theme.current == 'dark') {
            gridMaterial.color.set(0xc8c8c8);
        } else {
            gridMaterial.color.set(0xfefefe);
        }
        gridMaterial.needsUpdate = true;
    });

    $effect(() => {
        if (!canvas3d) return;

        const renderer = new WebGLRenderer({ canvas: canvas3d });
        renderer.setClearAlpha(0.0);

        const orbitControls = new OrbitControls(camera3d, canvas3d);
        orbitControls.enablePan = false;
        orbitControls.enableZoom = false;
        camera3d.position.set(0.0, 0.0, 7.5);
        camera3d.lookAt(0.0, 0.0, 0.0);
        orbitControls.target.set(0.0, 0.0, 0.0);
        orbitControls.update();

        $effect(() => {
            if (!width3d) return;
            renderer.setSize(width3d, width3d / aspect);
        });

        renderer.setAnimationLoop(animate);
        function animate() {
            renderer.render(scene3d, camera3d);
        }
        return () => {
            renderer.setAnimationLoop(null);
        };
    });

    $effect(() => {
        if (!canvas2d) return;

        const renderer = new WebGLRenderer({ canvas: canvas2d });
        renderer.setClearAlpha(0.0);

        camera2d.position.set(0.0, 0.0, 1.0);
        camera2d.lookAt(0.0, 0.0, 0.0);

        $effect(() => {
            if (!width2d) return;
            renderer.setSize(width2d, width2d / aspect);
        });

        renderer.setAnimationLoop(animate);
        function animate() {
            renderer.render(scene2d, camera2d);
        }
        return () => {
            renderer.setAnimationLoop(null);
        };
    });

    $effect(() => {
        if (!canvasMap || typeof widthMap == 'undefined' || typeof heightMap == 'undefined') return;
        const aspect = widthMap / heightMap;
        const rBase = 200.0;
        const d = 15.0;
        const e = 0.5;
        let cx, cy, r, t0, t1, t, c1, s1, textdx, textdy;
        if (widthMap > heightMap) {
            cx = 0.525 * widthMap;
            cy = 0.5 * heightMap;
            r = rBase / aspect;
            t0 = -Math.PI / 2.0 - 0.5;
            t1 = -Math.PI / 2.0 + 0.5;
            t = 0.5 * (t0 + t1);
            c1 = Math.cos(t1);
            s1 = Math.sin(t1);
            textdx = -20;
            textdy = -55;
        } else {
            cx = 0.525 * widthMap;
            cy = 0.525 * heightMap;
            r = rBase * aspect;
            t0 = -0.5;
            t1 = 0.5;
            t = 0.5 * (t0 + t1);
            c1 = Math.cos(t1);
            s1 = Math.sin(t1);
            textdx = 10;
            textdy = -40;
        }
        textxManifold = (60 / 480) * Math.max(widthMap - 528, 0);
        textxPlane = widthMap - textxManifold - 60;
        textxMap = cx + r * Math.cos(t) + textdx;
        textyMap = cy + r * Math.sin(t) + textdy;
        if (canvasMap) {
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
        }
    });

    $effect(() => {
        if (!hitPoint2d || !chart) return;
        point2d.position.copy(hitPoint2d);
        const uv = new Vector2(hitPoint2d.x, hitPoint2d.y)
            .applyMatrix3(chart.coordinates.preComposition.matrixInv)
            .applyMatrix3(chart.coordinates.postComposition.matrix)
            .add(chart.coordinates.domain.center);
        point3d.position.copy(TORUS(uv.x, uv.y));
    });

    // resource cleanup
    onDestroy(() => {
        manifoldGeometry.dispose();
        manifoldMaterial.dispose();
        chartsGeometry.dispose();
        chartsMaterial.dispose();
        point3dGeometry.dispose();
        point3dMaterial.dispose();
        domainGeometry.dispose();
        domainMaterial.dispose();
        point2dGeometry.dispose();
        point2dMaterial.dispose();
    });

    // chart hovering callback
    function onmousemove(
        e: MouseEvent,
        canvas: HTMLCanvasElement,
        camera: PerspectiveCamera | OrthographicCamera,
        object: Object3D,
    ): Vector3 | undefined {
        const rect = canvas.getBoundingClientRect();
        const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(new Vector2(mouseX, mouseY), camera);
        const hits = raycaster.intersectObject(object);
        if (hits.length) {
            return hits[0].point;
        }
        return undefined;
    }
    function onmousemove2d(e: MouseEvent) {
        if (!canvas2d || e.buttons != 0) return;
        hitPoint2d = onmousemove(e, canvas2d, camera2d, domain);
    }
</script>

{#snippet success()}
    <div class="component">
        <div class="canvas" bind:clientWidth={width3d}>
            <canvas bind:this={canvas3d}></canvas>
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

<NeedJavascript {success} />

<style>
    .component {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        justify-content: center;
        position: relative;
        color: #46ae52;
    }
    .canvas {
        width: 50%;
        min-width: 250px;
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
        font-size: 36pt !important;
    }
</style>
