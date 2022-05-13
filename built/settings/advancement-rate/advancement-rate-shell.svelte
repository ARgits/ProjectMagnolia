<svelte:options accessors={true} />

<script>
  import { onMount } from "svelte";
  import SettingsSubmitButton from "../../general svelte components/SettingsSubmitButton.svelte";
  import { ApplicationShell } from "@typhonjs-fvtt/runtime/svelte/component/core";
  export let elementRoot;
  const setting = "advancement-rate"; //name of setting
  let data = game.settings.get("ard20", setting); //get setting
  let funcList = Object.getOwnPropertyNames(math); //get all possible functions from math.js library
  //create several Sets where we will store wrong variables
  let formulaSet = {};
  let spanDiv = {};
  let formulaInput = {};
  let variableInput = {};
  let formulaSpan = {};
  //creaet list of parameters
  let paramArr = ["attributes", "skills", "features"];
  for (let item of paramArr) {
    spanDiv[item] = "";
    formulaSet[item] = { set: new Set(), check: false };
    formulaInput[item] = "";
    variableInput[item] = "";
    formulaSpan[item] = data.formulas[item];
  }
  //add to funcList variables
  $: {
    for (let item of Object.values(data.variables)) {
      funcList.push(item.shortName);
    }
  }
  //set position for divs with span
  onMount(() => {
    for (let elem of elementRoot.querySelectorAll("input.transparent")) {
      let div = elem.nextElementSibling.style;
      div.margin = getComputedStyle(elem).margin;
      div.padding = getComputedStyle(elem).padding;
      div.left = elem.getBoundingClientRect().left + "px";
      div.top = elem.getBoundingClientRect().top + "px";
      div.border = getComputedStyle(elem).border;
      div["border-color"] = "transparent";
      console.log(div.top, div.left);
    }
  });
  $: if (formulaSpan&&elementRoot) {
    for (let elem of elementRoot.querySelectorAll("input.transparent")) {
      let div = elem.nextElementSibling.style;
      console.log(elem.getBoundingClientRect().left + "px", elem.getBoundingClientRect().top + "px", "elem params");
      console.log(div.top, div.left, "div params");
    }
  }
  /**
   * replace part of string at given index
   * @param {string} str - String
   * @param {number} index  - chosen start index
   * @param {string} replacement - string which replaces old one
   * @param {number} endLength - chosen end index
   */
  function replaceStrAt(str, index, replacement, endLength) {
    if (index >= str.length) {
      return str.valueOf();
    }
    return str.substring(0, index) + replacement + str.substring(index + endLength);
  }
  function validateInput(val, type) {
    formulaSpan[type] = val;
    let checkArr = val.split(/[./+\*,^\s\(\)]+/);
    formulaSet[type].set.clear();
    for (let item of checkArr) {
      if (item !== "" && isNaN(item)) {
        let check = !funcList.includes(item);
        if (check) {
          formulaSet[type].set.add(item);
          let lastSpan =
            formulaSpan[type].lastIndexOf("</span>") > 0 ? formulaSpan[type].lastIndexOf("</span>") + 8 : -1;
          let wordLastIndex = formulaSpan[type].indexOf(item);
          formulaSpan[type] = replaceStrAt(
            formulaSpan[type],
            Math.max(lastSpan, wordLastIndex),
            `<span style="color:red">${item}</span>`,
            item.length
          );
        }
      }
    }
    formulaSet[type].check = formulaSet[type].set.size > 0;
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
            bind:this={spanDiv[param]}
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
          {#if formulaSet[param].check}
            <div style="color:red">
              there is no such variable as {[...formulaSet[param].set].join(", ")}
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
