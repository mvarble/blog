<script lang="ts">
    import { onDestroy, untrack } from 'svelte';
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
        CircleGeometry,
        Object3D,
    } from 'three';
    import { OrbitControls } from 'three/examples/jsm/Addons.js';

    import NeedJavascript from '$lib/components/need-javascript.svelte';
    import { Charts, torus, TORUS, type Chart } from '../util/torus';

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
    let width3d: number | undefined = $state(undefined);
    let canvas3d: HTMLCanvasElement | undefined = $state(undefined);
    let canvas2d: HTMLCanvasElement | undefined = $state(undefined);
    let hitPoint3d: Vector3 | undefined = $state(TORUS(0.0, 0.5 * Math.PI));
    let hitPoint2d: Vector3 | undefined = $state(undefined);
    let chart: Chart | undefined = $state(undefined);
    let width2d: number | undefined = $state(undefined);

    // reactivity
    $effect(() => {
        if (!canvas3d) return;

        const renderer = new WebGLRenderer({ canvas: canvas3d });
        renderer.setClearAlpha(0.0);

        const orbitControls = new OrbitControls(camera3d, canvas3d);
        camera3d.position.set(0.0, 0.0, 10.0);
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
        if (!hitPoint3d) return;
        point3d.position.copy(hitPoint3d);
        charts.updateChartsFromNearest(hitPoint3d);
        chart = charts.getCurrent()[0];
        const st = charts.chartsCoords(hitPoint3d)[0]!;
        point2d.position.set(st.x, st.y, 0.0);
    });

    $effect(() => {
        if (!hitPoint2d || !chart) return;
        point2d.position.copy(hitPoint2d);
        const uv = new Vector2(hitPoint2d.x, hitPoint2d.y)
            .applyMatrix3(chart.coordinates.composition.matrixInv)
            .add(chart.coordinates.domain.center);
        point3d.position.copy(TORUS(uv.x, uv.y));
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
        if (!canvas) return;
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
    function onmousemove3d(e: MouseEvent) {
        if (!canvas3d) return;
        hitPoint3d = onmousemove(e, canvas3d, camera3d, manifold);
    }
    function onmousemove2d(e: MouseEvent) {
        if (!canvas2d) return;
        hitPoint2d = onmousemove(e, canvas2d, camera2d, domain);
    }
</script>

{#snippet success()}
    <div class="component">
        <div class="canvas" bind:clientWidth={width3d}>
            <canvas bind:this={canvas3d} onmousemove={onmousemove3d}></canvas>
        </div>
        <div class="canvas" bind:clientWidth={width2d}>
            <canvas bind:this={canvas2d} onmousemove={onmousemove2d}></canvas>
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
    }
    .component > * {
        width: 50%;
        flex-grow: 1;
        max-width: 500px;
    }
    .component > :first-child {
        text-align: center;
    }
    .canvas {
        overflow: hidden;
        min-width: 150px;
    }
</style>
