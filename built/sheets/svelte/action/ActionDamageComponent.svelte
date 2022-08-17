<svelte:options accessors={true}/>
<script>
    import { localize } from "@typhonjs-fvtt/runtime/_dist/svelte/helper/index.js";
    import MultiSelect from "svelte-multiselect/MultiSelect.svelte";
    import { getContext } from "svelte";

    export let actionStore;
    const { application } = getContext("external");
    let damageTypeOptions = [];
    for (const [key1, label1] of Object.entries(CONFIG.ARd20.DamageTypes)) {
        for (const [key2, label2] of Object.entries(CONFIG.ARd20.DamageSubTypes)) {
            damageTypeOptions = [...damageTypeOptions, {
                label: `${localize(label1)} ${localize(label2)}`,
                value: [key1, key2]
            }];
        }
    }

    async function submit() {
        await application.submit();
    }


    async function deleteDamage(index) {
        $actionStore.damage.splice(index, 1);
        await application.submit();
        $actionStore.damage = [...$actionStore.damage];
    }

    async function addDamage() {
        let newDamage = { normal: ['', []], fail: ['', []], sameOnFail: true };
        $actionStore.damage = [...$actionStore.damage, newDamage];
        await application.submit();
    }

    async function changeFailFormula(index) {
        $actionStore.damage[index].fail = $actionStore.damage[index].sameOnFail ? $actionStore.damage[index].normal : $actionStore.damage[index].fail;
        await application.submit();
    }
</script>
{#each $actionStore.damage as dam, index (index)}
    <div class="damage">
        <input class="input normal" on:change={submit} bind:value={dam.normal[0]}/>
        <MultiSelect on:change={submit} bind:selected={dam.normal[1]} options={damageTypeOptions}>
            <i slot="remove-icon" class="fa-solid fa-xmark"></i>
        </MultiSelect>
        <label class:hidden={!$actionStore.useOnFail}>
            <input type="checkbox" on:change={()=>changeFailFormula(index)}
                   bind:checked={dam.sameOnFail}/>same on fail</label>

        <input class:hidden={dam.sameOnFail||!$actionStore.useOnFail || !$actionStore.isSubAction} class="input fail"
               on:change={submit}
               bind:value={dam.fail[0]}/>
        <MultiSelect on:change={submit} bind:selected={dam.fail[1]}
                     options={damageTypeOptions}>
            <i slot="remove-icon" class="fa-solid fa-xmark"></i>
        </MultiSelect>

        <i on:click={()=>{deleteDamage(index)}} class="fa-solid fa-minus"></i>
    </div>
{/each}
<i on:click={addDamage} class="fa-solid fa-plus"></i>
<style lang="scss">
  :global(button.remove-all) {
    width: initial;
  }

  .damage {
    display: flex;

    & > *:not(.hidden) {

    }
  }

  .input {
    align-self: center;
  }

  .hidden {
    opacity: 0;
  }

  :global(.input.hidden + div.multiselect) {
    opacity: 0;
  }
</style>