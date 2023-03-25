function GameObjectListItem(props: { text: string }) {
    return <>{props.text}</>;
}

export default function GameObjectList() {
    return (
        <ul
            class="
        divide-y-2 divide-blue-200 dark:divide-zinc-600 
        font-sans overflow-ellipsis text-lg text-left whitespace-nowrap
        mx-auto shadow-lg"
        >
            <li>
                <GameObjectListItem text="Hi this is mark and today we're going to cook some doritoes" />
            </li>
            <li>
                <GameObjectListItem text="Hi2" />
            </li>
            <li>
                <GameObjectListItem text="Hi3" />
            </li>
        </ul>
    );
}
