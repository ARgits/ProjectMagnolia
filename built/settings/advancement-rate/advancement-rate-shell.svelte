<svelte:options accessors={true} />

<script>
  import { getContext } from "svelte";
  import SettingsSubmitButton from "../../general svelte components/SettingsSubmitButton.svelte";
  import { ApplicationShell } from "@typhonjs-fvtt/runtime/svelte/component/core";
  const application = getContext("external").application;
  const { top, left, width, height, rotateX, rotateY, rotateZ, scale, zIndex } = application.position.stores;
  const setting = "advancement-rate";
  let data = game.settings.get("ard20", setting);
  let funcList = Object.getOwnPropertyNames(math);
  export let elementRoot;
  let paramArr = ["attributes", "skills", "features"];
  let variableInput = {
    attributes: "",
    skills: "",
    features: "",
  };
  let formulaInput = {
    attributes: "",
    skills: "",
    features: "",
  };
  let formulaSpan = {
    attributes: data.formulas.attributes,
    skills: data.formulas.skills,
    features: data.formulas.features,
  };
  $: {
    for (let item of Object.values(data.variables)) {
      funcList.push(item.shortName);
    }
  }
  function validateInput(val, type) {
    formulaSpan[type] = val;
    let checkArr = val.split(/[./+\*,^\s\(\)]+/);
    for (let item of checkArr) {
      if (item !== "" && isNaN(item)) {
        let check = !funcList.includes(item);
        if (check) {
          console.log(item);
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
    {#each paramArr as param, key}
      <div>
        <label for="Attribute Formula">Attribute Advancement Formula</label>
        <input
          class="transparent"
          type="text"
          on:input={() => {
            validateInput(formulaInput[param].value, param);
          }}
          bind:this={formulaInput[param]}
          bind:value={data.formulas[param]}
        />
      </div>
      <div class="span" style="top:calc(17.3em + 4.2em * ({key}-1))">
        {@html formulaSpan[param]}
      </div>
      <br />
    {/each}
    <SettingsSubmitButton {setting} {data} />
  </div>
</ApplicationShell>

<style lang="scss">
  input.transparent {
    color: transparent;
    caret-color: black;
  }
  input.transparent::selection{
    background: grey;
    &+div.span{
      font-weight: bold;
    }
  }
  div.span {
    position: absolute;
    left: 0.865em;
  }
</style>
