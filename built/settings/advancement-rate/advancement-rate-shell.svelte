<svelte:options accessors={true} />

<script>
  import { onMount } from "svelte";
  import SettingsSubmitButton from "../../general svelte components/SettingsSubmitButton.svelte";
  import { ApplicationShell } from "@typhonjs-fvtt/runtime/svelte/component/core";
  import { element } from "svelte/internal";
  const setting = "advancement-rate";
  let data = game.settings.get("ard20", setting);
  let funcList = Object.getOwnPropertyNames(math);
  let formulaSet = {
    attributes: new Set(),
    skills: new Set(),
    features: new Set(),
  };
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
  onMount(() => {
    for (let elem of elementRoot.querySelectorAll("input.transparent")) {
      let div = elem.nextElementSibling.style;
      div.margin = getComputedStyle(elem).margin;
      div.padding = getComputedStyle(elem).padding;
      div.left = elem.getBoundingClientRect().left + "px";
      div.top = elem.getBoundingClientRect().top + "px";
      div.border = getComputedStyle(elem).border;
      div["border-color"] = "transparent";
    }
  });
  function replaceStrAt(str, index, replacement, endLength) {
    if (index >= str.length) {
      return str.valueOf();
    }
    return str.substring(0, index) + replacement + str.substring(index + endLength);
  }
  function validateInput(val, type) {
    formulaSpan[type] = val;
    let checkArr = val.split(/[./+\*,^\s\(\)]+/);
    formulaSet[type].clear();
    console.log(checkArr);
    for (let item of checkArr) {
      if (item !== "" && isNaN(item)) {
        let check = !funcList.includes(item);
        if (check) {
          formulaSet[type].add(item);
          console.log(formulaSpan[type], "spanValue");
          console.log(item, "item");
          let lastSpan =
            formulaSpan[type].lastIndexOf("</span>") > 0 ? formulaSpan[type].lastIndexOf("</span>") + 8 : -1;
          let wordLastIndex = formulaSpan[type].indexOf(item);
          console.log(lastSpan, wordLastIndex);
          formulaSpan[type] = replaceStrAt(
            formulaSpan[type],
            Math.max(lastSpan, wordLastIndex),
            `<span style="color:red">${item}</span>`,
            item.length
          );
          console.log(formulaSpan[type]);
        }
      }
    }
    console.log(formulaSet[type].size)
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
    <div class="formula">
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
          <div
            class="span"
            on:click={(e) => {
              e.target.previousElementSibling.focus();
            }}
            on:dblclick={(e) => {
              e.target.previousElementSibling.focus();
              e.target.previousElementSibling.select();
            }}
          >
            {@html formulaSpan[param]}
          </div>
          {#if [...formulaSet[param]].length > 0}
            <div style="color:red">
              there is no such variable as {[...formulaSet[param]].join(", ")}
            </div>
          {/if}
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
