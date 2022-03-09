<svelte:options accessors={true} />

<script>
  import { getContext } from "svelte";
  import { localize } from "@typhonjs-fvtt/runtime/svelte/helper";
  const { application } = getContext("external");
  let form;
  export let advancementSetting;
  async function updateSettings() {
    application.update(advancementSetting);
    application.close();
  }
  function requestSubmit() {
    form.requestSubmit;
  }
  console.log(advancementSetting)
</script>

<form bind:this={form} on:submit|once|preventDefault={updateSettings} autocomplete="off">
  <section class="grid grid-2col">
    <div class="flexrow">
      <label>CustomValues</label>
      <div>
        <label>AV - Attribute Value</label>
        <input bind:value={advancementSetting.variables.attributeValue} />
      </div>
      <div>
        <label>SV - Skill Value</label>
        <input bind:value={advancementSetting.variables.skillValue} />
      </div>
      <div>SL - Skill level</div>
    </div>
    <div>
      <label>Non-custom Values</label>
      <div>As - Attribute Score</div>
      <div>SS - Skill Score</div>
      <div>SL - Skill level</div>
    </div>
  </section>
  <section>
    <div>
      <label>Attribute Advancement Formula</label>
      <input bind:value={advancementSetting.formulas.attributes} />
    </div>
  </section>
</form>
