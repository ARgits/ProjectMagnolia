<svelte:options accessors={true}/>

<script>
    import { getContext } from "svelte";

    export let action;
    console.log(action);
    const { application } = getContext("external");
    const targetType = [
        { id: 1, value: 'single' },
        { id: 2, value: 'self' },
        { id: 3, value: 'all' },
        { id: 4, value: 'custom' }
    ];
    const actionType = [
        { id: 1, value: 'Attack', disabled: false },
        { id: 2, value: 'Common', disabled: false },
        { id: 3, value: 'Heal', disabled: true },
    ];

    async function submit() {
        let item;
        const actorId = action.parent.actor;
        const itemId = action.parent.item;
        if (actorId || itemId) {
            const uuid = itemId || actorId;
            item = await fromUuid(uuid);
            console.log(item);
        }
        else {
            console.log("ОШиБКА БЛЯТЬ", action);
            return;
        }
        const actionList = [...item.system.actionList];
        await item.update({ "system.actionList": actionList });
        application.close();
    }

    function checkRange(type, val) {
        action[type][val] = Math[val](action[type].min, action[type].max);
    }
</script>

<div class="main">
    <h2>This is main tab</h2>
    <div class="name">
        Name: <input bind:value={action.name}/>
    </div>
    <div>
        Formula: <input bind:value={action.formula}/>
    </div>
    <div class="type">
        <select bind:value={action.type}>
            {#each actionType as type}
                <option disabled={type.disabled} value={type.value}>{type.value}</option>
            {/each}
        </select>
    </div>
    <fieldset class="range">
        <legend>Range</legend>
        <div>
            Minimum: <input on:change={()=>checkRange('range','min')} bind:value={action.range.min}/>
        </div>
        <div>
            Maximum: <input on:change={()=>checkRange('range','max')} bind:value={action.range.max}/>
        </div>
    </fieldset>
    <fieldset class="target">
        <legend>Target</legend>
        <select bind:value={action.target.type}>
            {#each targetType as target (target.id)}
                <option value={target.value}>
                    {target.value}
                </option>
            {/each}
        </select>
        {#if action.target.type === 'custom'}
            <div>
                <input bind:value={action.target.min} on:change={()=>checkRange('target','min')}/>
                <span>/</span>
                <input bind:value={action.target.max} on:change={()=>checkRange('target','max')}/>
            </div>
        {/if}
    </fieldset>
    <div class="submit">
        <button on:click={() => {submit();}}>
            Submit
        </button>
    </div>
</div>

<style lang="scss">
</style>
