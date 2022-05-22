<svelte:options accessors={true} />

<script>
  import InputForDocumentSheet from "./InputForDocumentSheet.svelte";
  export let doc;
</script>

<header>
  <div class="name">
    Name: <InputForDocumentSheet bind:value={doc.name} />
  </div>
  <div class="cha-img"><img src={doc.img} alt="characer portrait" /></div>
</header>
