<svelte:options accessors={true}/>
<script>
    import { getContext } from "svelte";

    import OptionsComponent from "./OptionsComponent.svelte";

    export let id;
    export let options;
    console.log(id);
    const { application } = getContext('external');
    let inputField;
    let element;
    const doc = getContext(`ActionData-${id}`);
    console.log(doc);

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

    function addComponent() {
        if (!element) {
            element = new OptionsComponent({
                target: document.body,
                props: { position: inputField.getBoundingClientRect(), options, doc }
            });
        }
        else {
            removeComponent();
        }
    }

    function removeComponent() {
        if (element) {
            element.$destroy();
            element = null;
        }
    }
</script>
Damage Type
<div class="main" use:clickOutside on:outclick={()=>{removeComponent()}}>
    <div bind:this={inputField} on:click={()=>{addComponent()}} class="input-field">{$doc.damage}</div>
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
</style>