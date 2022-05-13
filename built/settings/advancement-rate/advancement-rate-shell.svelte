<svelte:options accessors={true} />

<script>
  import { onMount } from "svelte";
  import SettingsSubmitButton from "../../general svelte components/SettingsSubmitButton.svelte";
  import { ApplicationShell } from "@typhonjs-fvtt/runtime/svelte/component/core";
import { element } from "svelte/internal";
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
  onMount((element)=>{
    console.log(element)
    if(element.classList.includes('transparent')){
      let div = element.nextElementSibling
      div.style.padding = getComputedStyle(element).padding
      div.style.margin = getComputedStyle(element).margin
      div.style.top = element.getBoundingClientRect().top+'px'
      div.style.left = element.getBoundingClientRect().left+'px'
    }
  })
  function validateInput(val, type) {
    formulaSpan[type] = val;
    let checkArr = val.split(/[./+\*,^\s\(\)]+/);
    for (let item of checkArr) {
      if (item !== "" && isNaN(item)) {
        let check = !funcList.includes(item);
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
    {#each paramArr as param}
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
        <div class="span">
          {@html formulaSpan[param]}
        </div>
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
  input.transparent::selection {
    background: grey;
    & + div.span {
      font-weight: bold;
    }
  }
  div.span {
    position: absolute;
  }
</style>
