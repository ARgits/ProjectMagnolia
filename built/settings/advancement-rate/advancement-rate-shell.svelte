<svelte:options accessors={true} />

<script>
  import SettingsSubmitButton from "../../general svelte components/SettingsSubmitButton.svelte";
  import { ApplicationShell } from "@typhonjs-fvtt/runtime/svelte/component/core";
  const setting = "advancement-rate";
  let data = game.settings.get("ard20", setting);
  let funcList = Object.getOwnPropertyNames(math);
  export let elementRoot;
  let variableInput = {
    attribute:'',
    skill:'',
    feature:'',
  };
  let formulaInput = {
    attribute:'',
    skill:'',
    feature:'',
  };
  let formulaSpan = {
    attribute:'',
    skill:'',
    feature:''
  }
  let variablesList;
  $: {
    variablesList = Object.entries(data.variables).map((item) => {
      return item.shortName;
    });
  }
  function validateInput(val,type) {
    formulaSpan[type] = val;
    let checkArr = val.split(/[./+\*,^\s]+/);
    for (let item of checkArr) {
      if (item !== "" && isNaN(item)) {
        check = !funcList.includes(item);
        if (check) {
          let regexp = new RegExp(`(?<!>|<)${item}\\b(?!\w|>)`, "");
          formulaSpan[type] = formulaSpan[type].replace(regexp, `<span style="color:red">${item}</span>`);
        }
      }
    }
  }
</script>

<ApplicationShell bind:elementRoot>
  <div class="">
    <div>
      <label for="Custom Values"> CustomValues </label>
      <div class="grid grid-2col">
        {#each Object.values(data.variables) as variable}
          <label for={variable.longName}>{variable.longName}</label>
          <input bind:value={variable.shortName} placeholder="shortName" />
        {/each}
      </div>
    </div>
    <div>
      <label for="Attribute Formula">Attribute Advancement Formula</label>
      <div class="span">
        {@html formulaSpan.attribute}
      </div>
      <input type="text" on:input={()=>{validateInput(formulaInput.attribute.value,'attribute')}} bind:this={formulaInput.attribute} bind:value={data.formulas.attributes} />
    </div>
    <br />
    <div>
      <label for="Skill Formula">Skill Advancement Formula</label>
      <input type="text" bind:value={data.formulas.skills} />
    </div>
    <br />
    <div>
      <label for="Feature Formula">Feature Advancement Formula</label>
      <input type="text" bind:value={data.formulas.features} />
    </div>
    <SettingsSubmitButton {setting} {data} />
  </div>
</ApplicationShell>
