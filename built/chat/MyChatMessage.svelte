<script>
    export let results;
</script>
<div>
    this is roll results from attack Action
</div>
<table>
    <thead>
    <tr>
        <th>Target</th>
        <th>Roll Result</th>
        <th>Target Defence</th>
        <th>Action Result</th>
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
            <td>{result.roll}</td>
            <td>{result.defence}</td>
            <td>{result.final}</td>
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