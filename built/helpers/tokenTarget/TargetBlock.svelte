<script>
    import { TJSDocument } from "@typhonjs-fvtt/runtime/svelte/store";

    export let target;
    const doc = new TJSDocument(target);
    console.log($doc.isTargeted);
</script>
<div class="container">
    <img class="img" class:isTargeted={$doc.isTargeted} src={$doc.texture.src} alt="doc">
    <div class="content" class:isTargeted={$doc.isTargeted}>
        Name:{$doc.name}
    </div>
</div>
<style>
    div.container {
        background: rgba(0, 0, 0, 0.2);
        display: flex;
        align-items: center;
        border-radius: 10px;
        border: 2px solid rgba(0, 0, 0, 0.2);
        padding: 0.25em;
        margin-top: auto;
    }

    .content {
        margin-left: 0.5em;
    }

    .img {
        background: rgba(0, 0, 0, 0.2);
        border-radius: 5px;
        border: 2px solid rgba(0, 0, 0, 0.2);
        max-height: 50px;
        max-width: 50px;
    }

    .isTargeted {
        background-color: #006c00;
    }


</style>