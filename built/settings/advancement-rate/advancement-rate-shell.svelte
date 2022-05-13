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
  let divFormula;
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
  onMount(() => {
    for (let elem of elementRoot.querySelectorAll("input.transparent")) {
      let div = elem.nextElementSibling;
      div.style.margin = getComputedStyle(elem).margin;
      div.style.padding = getComputedStyle(elem).padding;
      div.style.left = elem.getBoundingClientRect().left + "px";
      div.style.top = elem.getBoundingClientRect().top + "px";
      div.style.border = getComputedStyle(elem).border
			div.style['border-color'] = 'transparent'
    }
  });
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
  <div>
    <div>
      <label for="Custom Values"> CustomValues </label>
      <div class="grid grid-2col">
        {#each Object.values(data.variables) as variable}
          <label for={variable.longName}>{variable.longName}</label>
          <input bind:value={variable.shortName} placeholder="shortName" />
        {/each}
      </div>
    </div>
    <div class="formula" bind:this={divFormula}>
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
    </div>
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
      color: white;
    }
  }
  div.span {
    position: absolute;
  }
</style>
