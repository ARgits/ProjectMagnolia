<svelte:options accessors={true}/>
<script>
    import { getContext } from "svelte";

    import OptionsComponent from "./OptionsComponent.svelte";
    import { localize } from "@typhonjs-fvtt/runtime/svelte/helper";

    export let doc = void 0;
    export let options;
    const { application } = getContext('external');
    let inputField;
    let element;
    let damageText;

    function clickOutside(node) {
        const handleClick = (event) => {
            if (!node.contains(event.target) && !event.target.classList.contains('selectOption')) {
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
            application.reactive.damageInput = inputField;
            element = new OptionsComponent({
                target: document.body,
                props: { application, options, doc }
            });
        }
        else {
            removeComponent();
        }
    }

    function removeComponent(e) {
        if (element) {
            console.log(e, 'removeComponent function');
            application.reactive.damageInput = null;
            element.$destroy();
            element = null;
        }
    }

    const { top, left } = application.position.stores;
    $:{
        const damageArr = [].concat.apply([], $doc.damage);
        damageText = '';
        const dTypes = CONFIG.ARd20.DamageSubTypes;
        damageArr.forEach((t, index) => {damageText += index % 2 === 0 ? t[0].toUpperCase() + t.slice(1).toLowerCase() + 'ical' : ` ${localize(dTypes[t])}; `;});
        let damageTextArr = damageText.split('; ');
        console.log(damageTextArr);
        damageText = damageTextArr.length > 3 ? `${damageTextArr[0]}; ${damageTextArr[1]} and ${damageTextArr.length - 3} more` : damageText;
    }
</script>
Damage Type
<div class="main" use:clickOutside on:outclick={(e)=>{removeComponent(e)}}>
    <div bind:this={inputField} on:click={()=>{addComponent()}} class="input-field">{damageText}</div>
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