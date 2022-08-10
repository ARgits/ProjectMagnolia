<svelte:options accessors={true}/>
<script>
    import { getContext, tick } from "svelte";
    import { slide } from "svelte/transition";
    import DamageSelectDialog
        from "../../../general svelte components and dialogs/DamageSelect/DamageSelectDialog.svelte";

    export let action;
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
        { id: 4, value: 'Damage', disabled: false }
    ];

    async function submit() {
        let item;
        const actorId = action.parent.actor;
        const itemId = action.parent.item;
        if (actorId || itemId) {
            const uuid = itemId || actorId;
            item = await fromUuid(uuid);
        }
        else {
            return;
        }
        const actionList = [...item.system.actionList];
        await item.update({ "system.actionList": actionList });
        application.close();
    }

    function checkRange(type, val) {
        action[type][val] = Math[val](action[type].min, action[type].max);
    }

    let expanded = !action?.parent.action;

    function toggle() {
        if (action.parent.action) {
            expanded = !expanded;
        }
    }

    async function remove() {
        await action.removeSubAction();
        await tick();
    }

    $:console.log(action);
</script>
<div class:expanded class="main">

    <h3>
        <span on:click={toggle}>{action.name}</span>
        {#if action.parent.action}
            <i on:click={remove} class="fa-solid fa-trash-can"></i>
        {/if}
    </h3>
    {#if expanded}
        <div transition:slide={{duration:300}}>
            <div class="name">
                Name: <input bind:value={action.name}/>
            </div>
            <div class="type">
                <select bind:value={action.type}>
                    {#each actionType as type}
                        <option disabled={type.disabled} value={type.value}>{type.value}</option>
                    {/each}
                </select>
            </div>
            {#if action.parent.action}
                <div>
                    Use on Fail? <input type="checkbox" bind:checked={action.useOnFail}/>
                </div>
            {/if}
            <div class="formula">
                <div>
                    {#if action.useOnFail}Success{/if}Formula: <input bind:value={action.formula}/>
                </div>
                {#if action.parent.action && action.useOnFail}
                    <div> Fail Formula<input bind:value={action.failFormula}/></div>
                {/if}
                {#if action.type === 'Damage'}
                    <DamageSelectDialog
                            bind:choices={action.damage}
                            options={Object.entries(CONFIG.ARd20.DamageSubTypes)}
                    />
                {/if}
            </div>
            {#if !action.parent.action}
                <fieldset class="range">
                    <legend>Range</legend>
                    <div>
                        Minimum: <input on:change={()=>checkRange('range','min')} bind:value={action.range.min}/>
                    </div>
                    <div>
                        Maximum: <input on:change={()=>checkRange('range','max')} bind:value={action.range.max}/>
                    </div>
                </fieldset>
            {/if}
            {#if !action.parent.action}
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
            {/if}
            <fieldset class="actions">
                <legend>
                    Add actions <i on:click={() => { action.addSubAction();}} class="fa-solid fa-file-plus"></i>
                </legend>
                {#each action.subActions as subAct}
                    <svelte:self action={subAct}/>
                {/each}
            </fieldset>
            {#if !action.parent.action}
                <div class="submit">
                    <button on:click={submit}>
                        Submit
                    </button>
                </div>
            {/if}
        </div>
    {/if}
</div>
<style lang="scss">

</style>