<svelte:options accessors={true} />

<script>
  import { getContext } from "svelte";
  export let src;
  export let alt;
  console.log(src, alt);
  const document = getContext("DocumentSheetObject");
  let data;
  $: {
    data = { img: $document.img, system: $document.system, flags: $document.flags, name: $document.name };
  }
  function onEditImage(event) {
    console.log(event);
    /*const current = src;
    const fp = new FilePicker({
      type: "image",
      current: current,
      callback: (path) => {
        (src = path), document.update(data);
      },
      top: sheet.position.top + 40,
      left: sheet.posiiton.left + 10,
    });
    return fp.browse();*/
  }
</script>

<img {alt} {src} on:click={(event) => onEditImage(event)} />
