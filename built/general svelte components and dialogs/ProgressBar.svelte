<script>
  let max = 100;
  let min = 0;
  let value = 50;
  let rest;
  let progress;
  let progressLabelTop;
  $: if (progress) {
    progressLabelTop = (progress.offsetHeight - parseInt(getComputedStyle(progress, ":after").height)) / 2 + "px";
  }
</script>

<div class="progress">
  <progress data-label={rest} bind:this={progress} {max} {min} {value} style="--progressLabelTop:{progressLabelTop};" />
</div>

<style lang="scss">
  .progress {
    display: inline-block;
    position: relative;
    width: 100%;
    height: 100%;
  }
  progress{
    -webkit-appearance: none;
    height: 100%;
    width: 100%;
    &::-webkit-progress-bar {
      border-radius: 10px;
      border: 1px solid black;
      background-color: rgb(220, 220, 220);
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.25) inset;
    }
    &::-webkit-progress-value {
      background-color: rgb(0, 0, 255);
      border-radius: 10px;
    }
    &::after {
      content: attr(data-label);
      position: absolute;
      width: 100%;
      top: var(--progressLabelTop);
      text-align: center;
      color: rgb(255, 255, 0);
      mix-blend-mode: difference;
    }
  }
</style>
