<svelte:options accessors={true} />

<script>
  import { onMount, tick } from "svelte";
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
  //create list of parameters
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

  onMount(async () => {
    for (let param of paramArr) {
      console.log(data.formulas[param], param);
      await validateInput(data.formulas[param], param);
    }
  });

  /**
   * Check string for wrong things
   * @param {string} val - original input
   * @param {string} type - can be "attributes", "skills" or "features"
   */
  async function validateInput(val, type) {
    console.log(val, type, "ValidateInput function");
    formulaSpan[type] = val;
    let ind = 0; //starting index

    //create an array of variables/functions in formula field and their indexes
    let checkArr = val.split(/[-./+\*,^\s\(\)]+/).map((item) => {
      return { name: item, index: 0 };
    });
    for (let item of checkArr) {
      item.index = val.indexOf(item.name, ind);
      ind = item.index + 1;
    }
    formulaSet[type].set.clear();
    for (let item of checkArr) {
      if (item.name !== "" && isNaN(item.name)) {
        let check = !funcList.includes(item.name);
        if (check) {
          formulaSet[type].set.add(item.name);

          //get last index of changed word
          let lastSpan =
            formulaSpan[type].lastIndexOf("</span>") > 0 ? formulaSpan[type].lastIndexOf("</span>") + 8 : -1;

          //get new index of word
          let wordLastIndex = item.index + formulaSpan[type].length - val.length;
          formulaSpan[type] = replaceStrAt(
            formulaSpan[type],
            Math.max(lastSpan, wordLastIndex),
            `<span style="color:red">${item.name}</span>`,
            item.name.length
          );
        }
      }
    }
    formulaSet[type].check = formulaSet[type].set.size > 0;
    await tick();
    changeDivPosition();
  }
  function changeDivPosition() {
    for (let elem of elementRoot.querySelectorAll("input.transparent")) {
      let div = elem.nextElementSibling.style;
      div.margin = getComputedStyle(elem).margin;
      div.padding = getComputedStyle(elem).padding;
      div.left = Math.ceil(elem.offsetLeft * 1.01) + "px";
      div.top = Math.ceil(elem.offsetTop * 1.01) + "px";
      div.border = getComputedStyle(elem).border;
      div["border-color"] = "transparent";
      console.log(div.top, div.left);
    }
  }
  /**
   * Replace part of string at given index
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
</script>

<ApplicationShell bind:elementRoot>
  <div>
    <div>
      <label for="CustomValues"> CustomValues </label>
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
          <label for="AttributeFormula">Attribute Advancement Formula</label>
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
    pointer-events:none;
  }
</style>
