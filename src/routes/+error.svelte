<script>

    import { page } from '$app/stores'
    import { getIcon } from '$lib/icons'

    $inspect($page)

</script>

<div id="error">
    <h1>{$page.status}</h1>
    <p>{$page.error.message}</p>

    <a href="/">
        <span class="text">Get me out of here</span>
        <span class="icon">{@html getIcon('arrow')}</span>
    </a>
</div>

<style lang="scss">

    @use 'src/styles/variables' as *;

    #error {
        min-height: calc(100dvh - 80px);
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
        gap: 10px;
        padding: 20px;
        text-align: center;

        a {
            text-decoration: none;
            display: flex;
            align-items: center;
            flex-direction: row;
            gap: 10px;
            color: $sand;
            background-color: $black;
            padding: $standard-padding;
            text-transform: uppercase;
            margin-top: 20px;
            transition: ease all 300ms;

            &:hover { padding: $standard-padding 30px; }
        }
    }

</style>