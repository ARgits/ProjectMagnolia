<script>
  let name = "world";
  const selectArr = { magical: ["fire", "cold", "radiant", "piercing"], physical: ["fire", "cold", "poison", "piercing"] };
  const defaultArr = [["magical", "fire"]];
  let selectedArr = defaultArr.map((item) => {
    return item;
  });
  function deleteOption(key) {
    selectedArr.splice(key, 1);
    selectedArr = selectedArr;
  }
  let selectFocus = "";
  let cantDissapear;
  function onBlur() {
    if (!cantDissapear) {
      selectFocus = false;
    }
  }
  function onMouseEnter() {
    cantDissapear = true;
  }
  function onMouseLeave() {
    cantDissapear = false;
  }
  function onClick(e) {
    if (selectFocus !== "selectFocus") {
      selectFocus = true;
    }
  }
  function addItem(group, item) {
    let check = false;
    for (let elem of selectedArr) {
      check = check ? check : elem.includes(group) && elem.includes(item);
    }
    if (!check) selectedArr = [...selectedArr, [group, item]];
  }
</script>

<div>
  Select parameters
  <div  on:click={onClick} tabindex="-1" class="typeField" on:blur={onBlur}>
    {#each selectedArr as option, key}
      <div class="option">
        {option[0]}
        {option[1]}
        <div
          class="closeOption"
          on:click={() => {
            deleteOption(key);
          }}
        >
          x
        </div>
      </div>
    {/each}
  </div>
  <div tabindex="-1" on:mouseenter={onMouseEnter} on:mouseleave={onMouseLeave} on:blur={onBlur} class="selectField" class:selectFocus>
    {#each Object.entries(selectArr) as group}
      <div class="group">
        <label for="group">
          {group[0]}
        </label>
        {#each group[1] as item}
          <div
            on:click={() => {
              addItem(group[0], item);
            }}
            class="option"
          >
            {item}
          </div>
        {/each}
      </div>
    {/each}
  </div>
  <button
    on:click={() => {
      selectedArr = defaultArr;
    }}
  >
    Set default
  </button>
</div>

<style>
  .option:hover {
    border: 2px solid black;
  }
  .closeOption:active {
    bottom: 0.4em;
  }
  .closeOption {
    line-height: 12px;
    font-size: 12px;
    padding: 0.1em;
    height: 12px;
    width: 6px;
    margin: 0.3em;
    border: 0.5px solid black;
    position: relative;
    bottom: 0.5em;
    left: 0.5em;
  }
  label {
    height: fit-content;
    width: fit-content;
  }
  .option {
    display: flex;
    margin: 0.25em;
    padding: 0.25em;
    border: 1px solid black;
    height: fit-content;
    width: fit-content;
  }
  .typeField {
    display: flex;
    flex-wrap: wrap;
    border: 1px solid black;
    min-width: 50px;
    min-height: 50px;
    max-height: 80px;
    max-width: 300px;
    overflow-y: auto;
    overflow-x: hidden;
    height: fit-content;
    width: fit-content;
  }
  .selectField.selectFocus {
    display: flex;
    flex-wrap: wrap;
  }
  .selectField {
    max-height: 100px;
    max-width: 200px;
    overflow-y: auto;
    overflow-x: hidden;
    display: none;
    height: fit-content;
    width: fit-content;
    position: relative;
    border: 1px solid black;
    z-index: 50;
    background-color: white;
    top: 0.25em;
  }
  .group {
    margin: 0.1em;
  }
  .group label {
    background-color: grey;
    position: sticky;
    top: -0.1em;
  }
</style>
