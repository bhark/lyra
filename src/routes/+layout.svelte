<script>

    import { getIcon } from '$lib/icons'

    let { children } = $props()

</script>

<div id="nav">
    <span class="lyra">
        <a href="/">
            Lyra
        </a>
        <a href="https://github.com/bhark/lyra" target="_blank">
            <span class="icon">{@html getIcon('github')}</span>
        </a>
    </span>

    <a class="tetrabit" href="https://tetrabit.coop" target="_blank">Tetrabit</a>
</div>

<div id="content">
    {@render children()}
</div>

<style lang="scss" global>

    @use 'src/styles/main.scss' as *;
    @use 'src/styles/variables.scss' as *;

    #content {
        padding-top: 80px;
    }

    #nav {
        position: fixed;
        top: 0;
        left: 0;
        width: 100dvw;
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        padding: $standard-padding;
        border-bottom: solid 1px $black;
        background-color: $sand;
        z-index: 999;

        span, a {
            display: inline-flex;
            flex-direction: row;
            align-items: center;
            gap: 10px;
            font-size: 2rem;
            text-transform: uppercase;
            text-decoration: none;
            color: $black;
        }
    }

</style>