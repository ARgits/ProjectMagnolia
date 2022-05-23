<svelte:options accessors={true} />

<script>
  import { getContext } from "svelte";
  export let src;
  export let alt;
  const { application } = getContext("external"); //get sheet document
  const document = getContext("DocumentSheetObject");
  let data;
  function onEditImage(event) {
    const current = src;
    const fp = new FilePicker({
      type: "image",
      current: current,
      callback: async (path) => {
        src = path;
      },
      top: application.position.top + 40,
      left: application.position.left + 10,
    });
    return fp.browse();
  }
  async function updateDocument() {
    data = { img: $document.img, system: $document.system, flags: $document.flags, name: $document.name };
    await $document.update(data);
  }
</script>

<img {alt} {src} on:click={(event) => onEditImage(event)} on:load={updateDocument} />
