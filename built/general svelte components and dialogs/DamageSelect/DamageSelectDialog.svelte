<svelte:options accessors={true}/>
<script>
    export let choices = [];
    export let options;
    let hidden = true;

    function clickOutside(node) {
        const handleClick = (event) => {
            if (!node.contains(event.target)) {
                node.dispatchEvent(new CustomEvent("outclick"));
            }
        };

        document.addEventListener("click", handleClick, true);

        return {
            destroy() {
                document.removeEventListener("click", handleClick, true);
            }
        };
    }
</script>
Damage Type
<div class="main" use:clickOutside on:outclick={()=>{hidden=true}}>
    <div on:click={()=>{hidden=!hidden}} class="input-field"></div>
    <div class:hidden class="options">
        {#each options as type}
            <label class:checked={choices.includes(["phys",type[0]])}>
                <input type="checkbox" bind:group={choices} value={["phys",type[0]]}/> {type[1]}
            </label>
        {/each}
        {#each options as type}
            <label class:checked={choices.includes(["mag",type[0]])}>
                <input type="checkbox" bind:group={choices} value={["mag",type[0]]}/> {type[1]}
            </label>
        {/each}
    </div>
</div>
<style lang="scss">
  .main {
    flex: 1 0 33%;
  }

  .input-field {
    width: inherit;
    height: 30px;
    border: 1px solid black;
    padding: 0 0.35rem;
    box-sizing: border-box;
    min-width: 100%;
  }

  .options {
    position: absolute;
    box-sizing: border-box;
    width: inherit;
    display: flex;
    flex-direction: column;
    align-items: center;
    border: 1px solid black;
    border-top: none;
    background: url("../ui/parchment.jpg") repeat;

    &.hidden {
      display: none;
    }
  }

  label {
    width: 100%;
    text-align: center;

    &.checked {
      background-color: rgba(0, 255, 0, 0.3)
    }

    &:hover {
      cursor: pointer;
    }

    & input[type="checkbox"] {
      appearance: none;
      margin: 0;
      border: none;
      display: none
    }
  }
</style>