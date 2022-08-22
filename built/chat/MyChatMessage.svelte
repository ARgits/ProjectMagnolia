<script>
    export let results;

    async function onHoverToken(tokenUUID, hover) {
        const token = await fromUuid(tokenUUID);
        token._object.hover = hover;
        token._object.refresh();
    }

    $:console.log(results);
</script>
<div>
    this is roll results from attack Action
</div>
{#each results as result,index(index)}
    <div class="result">
        <div class="target" on:mouseenter={()=>onHoverToken(result.token, true)}
             on:mouseleave={()=>onHoverToken(result.token, false)}>
            <img alt="target pic" src={result.targetIcon}/>
            <span>{result.targetName}: </span>
        </div>
        {#each result.stats as stat,index}
            <div class="stat">
                {stat.actionName}: {stat.attack ?? stat.damage} - {stat.hit ? "success" : "fail"}
            </div>
            {#if index !== result.stats.length - 1}
                <i class="fa-solid fa-arrow-right-long"></i>
            {/if}
        {/each}
    </div>
{/each}
<style>
    .target,
    .stat {
        flex: 1 0
    }

    img {
        width: 3rem;
    }

    .stat {
        background-color: rgba(0, 0, 0, 0.1);
        padding: 0.2rem;
        margin: 0.1rem;
    }

    .result {
        display: flex;
        flex-wrap: wrap;
        flex-direction: row;
        align-items: center;
        align-content: center;
    }
</style>