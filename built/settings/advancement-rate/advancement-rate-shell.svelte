<svelte:options accessors={true} />

<script>
  import { ApplicationShell } from "@typhonjs-fvtt/runtime/svelte/component/core";
  export let form;
  let advancementSetting = game.settings.get("ard20", "advancement-rate");
  export let elementRoot;
  let attributeFormula;
  $: {
    attributeFormula = advancementSetting.formulas.attributes;
    for (let variable of Object.values(advancementSetting.variables)) {
      if (variable.value) {
        console.log(attributeFormula);
        attributeFormula = attributeFormula.replaceAll(variable.shortName, variable.value);
      }
    }
  }
  async function changeSetting() {
    await game.settings.set("ard20", "advancement-rate", advancementSetting);
    console.log("change");
  }
</script>

<ApplicationShell bind:elementRoot>
  <form bind:this={form} autocomplete="off">
    <section>
      <div>
        <label for="Custom Values"> CustomValues </label>
        <div class="grid grid-2col">
          {#each Object.values(advancementSetting.variables) as variable}
            <label for={variable.longName}>{variable.longName}</label>
            <input bind:value={variable.shortName} on:change={changeSetting} placeholder="shortName" />
          {/each}
        </div>
      </div>
    </section>
    <section>
      <div>
        <label for="Attribute Formula">Attribute Advancement Formula</label>
        <input type="text" on:change={changeSetting} bind:value={advancementSetting.formulas.attributes} />
      </div>
      <br>
      <div>
        <label for="Skill Formula">Skill Advancement Formula</label>
        <input type="text" on:change={changeSetting} bind:value={advancementSetting.formulas.skills} />
      </div>
      <br>
      <div>
        <label for="Feature Formula">Feature Advancement Formula</label>
        <input type="text" on:change={changeSetting} bind:value={advancementSetting.formulas.features} />
      </div>
    </section>
  </form>
</ApplicationShell>
