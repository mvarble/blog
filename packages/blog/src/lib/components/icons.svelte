<!--
Provides a list of SVG icons that can be referenced through the `Icon` component.
Very nifty trick copied from the Svelte docs, at:
https://github.com/sveltejs/svelte.dev/blob/main/packages/site-kit/src/lib/components/Icons.svelte
-->

<!-- feathericons.com -->
<div style="display: none">
    <svg>
        <symbol id="arrow-left" class="icon" viewBox="0 0 24 24">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
        </symbol>

        <symbol id="arrow-right" class="icon" viewBox="0 0 24 24">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
        </symbol>

        <symbol id="arrow-right-chevron" viewBox="0 0 24 24">
            <path
                fill="currentColor"
                d="M8.7 17.3q-.275-.275-.275-.7t.275-.7l3.9-3.9l-3.9-3.9q-.275-.275-.275-.7t.275-.7q.275-.275.7-.275t.7.275l4.6 4.6q.15.15.213.325t.062.375q0 .2-.063.375t-.212.325l-4.6 4.6q-.275.275-.7.275t-.7-.275Z"
            />
        </symbol>

        <symbol id="arrow-up" class="icon" viewBox="0 0 24 24">
            <line x1="12" y1="19" x2="12" y2="5" />
            <polyline points="5 12 12 5 19 12" />
        </symbol>

        <symbol id="arrow-down" class="icon" viewBox="0 0 24 24">
            <line x1="12" y1="5" x2="12" y2="19" />
            <polyline points="19 12 12 19 5 12" />
        </symbol>

        <symbol id="check" class="icon" viewBox="0 0 24 24">
            <polyline points="20 6 9 17 4 12" />
        </symbol>

        <symbol id="close" class="icon" viewBox="0 0 24 24">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </symbol>

        <symbol id="download" class="icon" viewBox="0 0 24 24">
            <path d="M21 15V19A2 2 0 0 1 19 21H5A2 2 0 0 1 3 19V15" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
        </symbol>

        <symbol id="edit" class="icon" viewBox="0 0 24 24">
            <path d="M20 14.66V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5.34" />
            <polygon points="18 2 22 6 12 16 8 16 8 12 18 2" />
        </symbol>

        <symbol id="git-branch" class="icon" viewBox="0 0 24 24">
            <line x1="6" y1="3" x2="6" y2="15" />
            <circle cx="18" cy="6" r="3" />
            <circle cx="6" cy="18" r="3" />
            <path d="M18 9a9 9 0 0 1-9 9" />
        </symbol>

        <symbol id="log-in" class="icon" viewBox="0 0 24 24">
            <path d="M15 3H19A2 2 0 0 1 21 5V19A2 2 0 0 1 19 21H15" />
            <polyline points="10 17 15 12 10 7" />
            <line x1="15" y1="12" x2="3" y2="12" />
        </symbol>

        <symbol id="maximize" class="icon" viewBox="0 0 24 24">
            <path
                d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"
            />
        </symbol>

        <symbol id="maximize-2" class="icon" viewBox="0 0 24 24">
            <polyline points="15 3 21 3 21 9" />
            <polyline points="9 21 3 21 3 15" />
            <line x1="21" y1="3" x2="14" y2="10" />
            <line x1="3" y1="21" x2="10" y2="14" />
        </symbol>

        <symbol id="menu" viewBox="0 0 48 48">
            <path
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="4"
                d="M7.95 11.95h32m-32 12h32m-32 12h32"
            />
        </symbol>

        <symbol id="message-square" class="icon" viewBox="0 0 24 24">
            <g transform="translate(0, 1)">
                <path
                    d="M16.5 19H11V15H18V11H22V19H19.5L18 20.5L16.5 19Z"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                />
                <path
                    d="M2 3H18V15H8.5L6.5 17L4.5 15H2V3 M5 10L5 12L10 12L10 10  M5 6L5 9L13 9L13 6Z"
                    fill="currentColor"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                />
            </g>
        </symbol>

        <symbol id="minus" class="icon" viewBox="0 0 24 24">
            <line x1="5" y1="12" x2="19" y2="12" />
        </symbol>

        <symbol id="plus" class="icon" viewBox="0 0 24 24">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
        </symbol>

        <symbol id="save" class="icon" viewBox="0 0 24 24">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
            <polyline points="17 21 17 13 7 13 7 21" />
            <polyline points="7 3 7 8 15 8" />
        </symbol>

        <symbol id="link" class="icon" viewBox="0 0 24 24">
            <path d="M9,7L6,7A2 2 0 0 0 6,17L9,17" />
            <path d="M15,7L18,7A2 2 0 0 1 18,17L15,17" />
            <path d="M7,12L17,12" />
        </symbol>

        <symbol viewBox="0 0 24 24" id="external-link">
            <path
                fill="currentColor"
                stroke-width="0"
                d="m16 8.4l-8.875 8.9q-.3.3-.713.3t-.712-.3q-.3-.3-.3-.713t.3-.712L14.6 7H7q-.425 0-.713-.288T6 6q0-.425.288-.713T7 5h10q.425 0 .713.288T18 6v10q0 .425-.288.713T17 17q-.425 0-.713-.288T16 16V8.4Z"
            />
        </symbol>

        <symbol id="chevron-up" class="icon" viewBox="0 0 24 24">
            <polyline points="18 15 12 9 6 15" />
        </symbol>

        <symbol id="chevron-down" class="icon" viewBox="0 0 24 24">
            <path d="m6 9 6 6 6-6" />
        </symbol>

        <symbol id="delete" class="icon" viewBox="0 0 24 24">
            <path
                fill="currentColor"
                stroke="none"
                d="M22 4.2h-5.6L15 1.6c-.1-.2-.4-.4-.7-.4H9.6c-.2 0-.5.2-.6.4L7.6 4.2H2c-.4 0-.8.4-.8.8s.4.8.8.8h1.8V22c0 .4.3.8.8.8h15c.4 0 .8-.3.8-.8V5.8H22c.4 0 .8-.3.8-.8s-.4-.8-.8-.8zM10.8 16.5c0 .4-.3.8-.8.8s-.8-.3-.8-.8V10c0-.4.3-.8.8-.8s.8.3.8.8v6.5zm4 0c0 .4-.3.8-.8.8s-.8-.3-.8-.8V10c0-.4.3-.8.8-.8s.8.3.8.8v6.5z"
            />
        </symbol>

        <symbol id="home" viewBox="0 0 256 256">
            <path
                fill="currentColor"
                d="m221.56 100.85l-79.95-75.47l-.16-.15a19.93 19.93 0 0 0-26.91 0l-.17.15l-79.93 75.47a20.07 20.07 0 0 0-6.44 14.7V208a20 20 0 0 0 20 20h48a20 20 0 0 0 20-20v-44h24v44a20 20 0 0 0 20 20h48a20 20 0 0 0 20-20v-92.45a20.07 20.07 0 0 0-6.44-14.7ZM204 204h-40v-44a20 20 0 0 0-20-20h-32a20 20 0 0 0-20 20v44H52v-86.72l76-71.75l76 71.75Z"
            />
        </symbol>

        <symbol id="search" viewBox="0 0 24 24">
            <path
                stroke-width="0.2"
                fill="currentColor"
                d="m18.9 20.3l-5.6-5.6q-.75.6-1.725.95T9.5 16q-2.725 0-4.612-1.888T3 9.5q0-2.725 1.888-4.612T9.5 3q2.725 0 4.612 1.888T16 9.5q0 1.1-.35 2.075T14.7 13.3l5.625 5.625q.275.275.275.675t-.3.7q-.275.275-.7.275t-.7-.275ZM9.5 14q1.875 0 3.188-1.313T14 9.5q0-1.875-1.313-3.188T9.5 5Q7.625 5 6.312 6.313T5 9.5q0 1.875 1.313 3.188T9.5 14Z"
            />
        </symbol>

        <symbol id="docs" viewBox="0 0 16 16">
            <path
                fill="currentColor"
                d="M1 3.25C1 2.56 1.56 2 2.249 2h.5c.69 0 1.248.56 1.248 1.25v9.495c0 .69-.559 1.25-1.248 1.25h-.5A1.25 1.25 0 0 1 1 12.744V3.249ZM2.249 3a.25.25 0 0 0-.25.25v9.495c0 .138.112.25.25.25h.5a.25.25 0 0 0 .25-.25V3.249a.25.25 0 0 0-.25-.25h-.5Zm2.748.25c0-.69.559-1.25 1.249-1.25h.5c.689 0 1.248.56 1.248 1.25v9.495c0 .69-.56 1.25-1.249 1.25h-.5a1.25 1.25 0 0 1-1.248-1.25V3.249ZM6.246 3a.25.25 0 0 0-.25.25v9.495c0 .138.112.25.25.25h.5a.25.25 0 0 0 .249-.25V3.249a.25.25 0 0 0-.25-.25h-.5Zm5.726 1.777a1.249 1.249 0 0 0-1.57-.713l-.583.204a1.25 1.25 0 0 0-.746 1.645l2.937 7.304c.249.62.94.933 1.571.713l.582-.204a1.25 1.25 0 0 0 .746-1.646l-2.937-7.303Zm-1.24.23a.25.25 0 0 1 .313.143l2.937 7.303a.25.25 0 0 1-.149.33l-.582.203a.25.25 0 0 1-.314-.142L10 5.54a.25.25 0 0 1 .149-.329l.582-.204Z"
            />
        </symbol>

        <symbol id="contents" viewBox="0 0 256 256" stroke-width="0">
            <path
                fill="currentColor"
                d="M224 44h-64a43.86 43.86 0 0 0-32 13.85A43.86 43.86 0 0 0 96 44H32a20 20 0 0 0-20 20v128a20 20 0 0 0 20 20h64a20 20 0 0 1 20 20a12 12 0 0 0 24 0a20 20 0 0 1 20-20h64a20 20 0 0 0 20-20V64a20 20 0 0 0-20-20ZM96 188H36V68h60a20 20 0 0 1 20 20v104.81A43.79 43.79 0 0 0 96 188Zm124 0h-60a43.71 43.71 0 0 0-20 4.83V88a20 20 0 0 1 20-20h60Z"
            />
        </symbol>

        <symbol viewBox="0 0 24 24" id="copy-to-clipboard-empty">
            <path
                fill="currentColor"
                d="M5 22q-.825 0-1.413-.588T3 20V6h2v14h11v2H5Zm4-4q-.825 0-1.413-.588T7 16V4q0-.825.588-1.413T9 2h9q.825 0 1.413.588T20 4v12q0 .825-.588 1.413T18 18H9Zm0-2h9V4H9v12Zm0 0V4v12Z"
            />
        </symbol>

        <symbol viewBox="0 0 24 24" id="copy-to-clipboard-filled">
            <path
                fill="currentColor"
                d="M5 22q-.825 0-1.413-.588T3 20V6h2v14h11v2H5Zm4-4q-.825 0-1.413-.588T7 16V4q0-.825.588-1.413T9 2h9q.825 0 1.413.588T20 4v12q0 .825-.588 1.413T18 18H9Z"
            />
        </symbol>

        <symbol viewBox="0 0 24 24" id="font-toggle">
            <g stroke="currentColor">
                <path d="m3 15 4-8 4 8" />
                <path d="M4 13h6" />
                <circle cx="18" cy="12" r="3" />
                <path d="M21 9v6" />
            </g>
        </symbol>

        <symbol viewBox="0 0 512 512" id="rat">
            <path
                d="M93.31161812,304.52715526 C93.31161812,304.52715526 32.77296053,315.32325275 32.77296053,355.22270174 C32.77296053,395.12215073 93.31161812,392.98147478 117.98490932,392.98147478 C142.65820052,392.98147478 196.69582123,382.37018577 207.73012345,393.00157707"
                fill="none"
                stroke="var(--rat-stroke, currentColor)"
                stroke-width="25"
                stroke-linecap="round"
                stroke-linejoin="round"
            />
            <path
                d="M333.47281828,188.96440508 C333.47281828,188.96440508 275.31666507,160.31159016 329.37608998,125.05544348 C367.0659904,100.47507364 375.25944702,158.6486156 375.25944702,158.6486156 C375.25944702,158.6486156 417.04607575,173.39683751 435.0716803,188.96440508 C453.09728485,204.53197265 473.58092639,227.47365117 478.49700036,229.93168815 C483.41307433,232.38972513 462.92943279,261.47649612 434.25233464,261.47649612 C405.57523649,261.47649612 347.7373301,272.16254044 337.0858365,294.28487329 C326.4343429,316.40720615 187.19160844,353.99636833 163.99921419,355.18572189 C140.80681994,356.37507544 70.46286096,329.07251319 92.58519382,244.67991006 C114.70752668,160.28730693 175.33910562,154.5518873 207.29358642,153.73254164 C239.24806722,152.91319597 283.78193044,157.00992428 333.47281828,188.96440508Z"
                fill="var(--rat-fill, currentColor)"
                stroke="var(--rat-stroke, currentColor)"
                stroke-width="30"
                stroke-linecap="round"
                style="paint-order: stroke;"
            />
            <path
                d="M374.26044305,275.42380376 C374.26044305,275.42380376 337.36182384,283.12594272 337.36182384,314.83009612 C337.36182384,345.84641504 343.71463905,334.80793282 357.23384246,341.36269811 C370.75304588,347.9174634 367.0659904,355.22270174 367.0659904,355.22270174 C367.0659904,355.22270174 318.72459638,355.22270174 318.72459638,355.22270174 C318.72459638,355.22270174 283.78193044,332.34989583 283.78193044,302.03410636"
                fill="var(--rat-fill, currentColor)"
                stroke="var(--rat-stroke, currentColor)"
                stroke-width="15"
                stroke-linecap="round"
                stroke-linejoin="round"
            />
            <path
                d="M209.24817005,247.39460954 C209.24817005,247.39460954 240.83740037,261.42528701 238.36949175,294.77845502 C235.90158313,328.13162302 191.3794226,333.45852523 191.3794226,333.45852523 C191.3794226,333.45852523 255.63498044,320.92015948 252.63829527,359.25173478 C252.63829527,359.25173478 162.72030088,359.78909331 162.72030088,359.78909331"
                fill="var(--rat-fill, currentColor)"
                stroke="var(--rat-stroke, currentColor)"
                stroke-width="15"
                stroke-linecap="round"
                stroke-linejoin="round"
            />
            <path
                d="M399.0204712,186.32670979 C406.35324333,186.32670979 412.30966008,192.28312654 412.30966008,199.61589868 C412.30966008,206.94867081 406.35324333,212.90508756 399.0204712,212.90508756 C391.68769906,212.90508756 385.73128231,206.94867081 385.73128231,199.61589868 C385.73128231,192.28312654 391.68769906,186.32670979 399.0204712,186.32670979Z "
                stroke="none"
                fill="var(--rat-stroke, currentColor)"
            />
        </symbol>
    </svg>
</div>
