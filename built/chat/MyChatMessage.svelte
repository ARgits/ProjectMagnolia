<script>
    export let results;
    $:console.log(results);
</script>
<div>
    this is roll results from attack Action
</div>
<table>
    <thead>
    <tr>
        <th>Target</th>
        <th>Attack</th>
        <th>Defence</th>
        <th>Hit?</th>
        <th>Damage</th>
    </tr>
    </thead>
    {#each results as result}
        <tr>
            <td class="target">
                <div>
                    <img alt="target pic" src={result.actor.img}/>
                    <span>{result.actor.name}</span>
                </div>
            </td>
            <td>{result.attack}</td>
            <td>{result.defence}</td>
            <td>{result.hit}</td>
            <td on:click={()=>{console.log('click')}}>{result.damage ?? ""}</td>
        </tr>
    {/each}
</table>
<style>
    .target div {
        display: flex;
        align-items: center;
        justify-content: space-around;

    }

    img {
        width: 35%
    }

    td, th {
        text-align: center;
    }

</style>