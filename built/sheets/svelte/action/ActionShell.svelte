<svelte:options accessors={true}/>

<script>
    import { getContext } from "svelte";
    import { min } from "mathjs";

    export let action;
    console.log(action);
    const { application } = getContext("external");

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

    function checkRange(type) {
        action.range[type] = Math[type](action.range.min, action.range.max);
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
    <fieldset class="range">
        <legend>Range</legend>
        <div>
            Minimum: <input on:change={()=>checkRange('min')} bind:value={action.range.min}/>
        </div>
        <div>
            Maximum: <input on:change={()=>checkRange('max')} bind:value={action.range.max}/>
        </div>
    </fieldset>
    <div class="submit">
        <button on:click={() => {submit();}}>
            Submit
        </button>
    </div>
</div>

<style lang="scss">
</style>
