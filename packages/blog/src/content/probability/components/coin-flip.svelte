<script lang="ts">
    import { onDestroy, onMount, untrack } from 'svelte';

    import {
        Scene,
        PerspectiveCamera,
        WebGLRenderer,
        Group,
        PointLight,
        AmbientLight,
        Vector3,
        Clock,
    } from 'three';
    import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

    import NeedJavascript from '$lib/components/need-javascript.svelte';
    import lib from '../code.svelte';
    import disposeGLTF from '$lib/util/dispose-gltf';
    import gltfPath from '../assets/coin.glb?url';

    // parameters (could be props)
    const aspect = 1.0;
    const baseFlips = 4;
    const flipDuration = 0.2;

    // constant resources
    const scene = new Scene();
    const pointLight = new PointLight(0xffffff, 50);
    const ambientLight = new AmbientLight(0xffffff, 10);
    const camera = new PerspectiveCamera(50, aspect, 1, 20);
    const loader = new GLTFLoader();
    const axis = new Vector3(1.0, 0.0, 0.0);
    const clock = new Clock();

    // state
    let width: number | undefined = $state(undefined);
    let canvas: HTMLCanvasElement | undefined = $state(undefined);
    let coin: Group | undefined = $state.raw(undefined);
    let sample = $state(true);
    let rotating = $state(false);

    // initialization
    scene.add(ambientLight);
    camera.add(pointLight);
    scene.add(camera);
    onMount(() => {
        loader.load(gltfPath, (gltf) => {
            coin = gltf.scene;
            scene.add(coin);
        });
    });

    // reactivity
    $effect(() => {
        if (!canvas) return;

        const renderer = new WebGLRenderer({ canvas });
        renderer.setClearAlpha(0.0);
        renderer.setAnimationLoop(animate);
        camera.position.y = 3;
        camera.lookAt(0, 0, 0);

        let t = 1.0;
        let flips = 0;
        let currentSample = untrack(() => sample);
        let newSample = currentSample;

        $effect(() => {
            if (!width) return;
            renderer.setSize(width, width / aspect);
        });

        $effect(() => {
            if (rotating && lib.bernoulli_sample) {
                newSample = lib.bernoulli_sample(0.5);
                flips = baseFlips + (currentSample == newSample ? 0 : 1);
                t = 0.0;
            }
        });

        function animate() {
            const delta = clock.getDelta();
            t = flips == 0 ? 1.0 : Math.min(t + delta / (flips * flipDuration), 1.0);
            coin?.setRotationFromAxisAngle(
                axis,
                (t * ((currentSample ? 0 : 1) + flips) * Math.PI) % (2.0 * Math.PI),
            );
            if (t == 1.0) {
                currentSample = newSample;
                sample = newSample;
                flips = 0;
                rotating = false;
            }

            renderer.render(scene, camera);
        }

        return () => {
            renderer.setAnimationLoop(null);
        };
    });

    // resource cleanup
    onDestroy(() => {
        if (!coin) return;
        disposeGLTF(coin);
        scene.remove(coin);
    });
</script>

<NeedJavascript loading={lib.loading}>
    {#if lib.bernoulli_sample}
        <div class="component">
            <div>
                <button
                    class="button"
                    onclick={() => (rotating = true)}
                    disabled={typeof coin == 'undefined' || rotating}>Randomly sample</button
                >
                <h4>{rotating ? 'spinning...' : sample ? 'heads' : 'tails'}</h4>
            </div>
            <div class="canvas" bind:clientWidth={width}>
                <canvas bind:this={canvas}></canvas>
            </div>
        </div>
    {:else}
        <p>The library unit <code>bernoulli_example</code> failed to load.</p>
    {/if}
</NeedJavascript>

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
        max-width: 300px;
    }
    .component > :first-child {
        text-align: center;
    }
    .canvas {
        overflow: hidden;
        min-width: 150px;
    }
</style>
