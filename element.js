// **************************************************************************** <slide-viewer>
customElements.define("slide-viewer", class extends HTMLElement {
    // -------------------------------------------------------------------- slidecount
    get slidecount() {
        return this.children.length;
    }
    // -------------------------------------------------------------------- reverse mode
    get reverse() {
        return this.hasAttribute("reverse");
    }
    set reverse(state) {
        this.toggleAttribute("reverse", this.hasAttribute("noreverse") ? false : state);
    }
    // -------------------------------------------------------------------- prev/next
    prev(reverse = this.reverse) {
        this.reverse = reverse;
        this.slide--;
    }
    next(reverse = this.reverse) {
        this.reverse = reverse;
        let nr = this.slide;
        if (reverse) {
            this.slide = (nr > 1) ? nr - 1 : ((this.reverse = false), nr + 1);
        } else {
            this.slide = (nr < this.slidecount)
                ? /* forwards */ nr + 1
                : /* at end, init reverse */ ((this.reverse = true),
                    (this.reverse
                        ? /* reverse if allow */ nr - 1
                        : /* or start at 1 */ 1
                    ));
        }
    }
    // -------------------------------------------------------------------- slide
    currentslide() { // get current slide by offset position
        for (let child of this.children) {
            let start = child.offsetLeft;
            let mid = this.slides.scrollLeft + this.slides.clientWidth / 2;
            if (start <= mid && (child.offsetWidth + start) >= mid) return child;
        }
    }
    get slide() { // get slide Number
        let idx = [...this.children].indexOf(this.currentslide());
        return idx >= 0 ? idx + 1 : -1;
    }
    set slide(nr) { // main code for showing a slide
        if (nr < 1) nr = this.slidecount;
        let slide = this.children[nr - 1];
        slide && (this.slides.scrollLeft = slide.offsetLeft - this.slides.offsetLeft);
        // dots are rendered on scrollend event
    }
    // -------------------------------------------------------------------- hold slide
    get hold() { // prevent animations/scrolls when cursor is over slides
        return this.hasAttribute("hold");
    }
    set hold(state) {
        this.toggleAttribute("hold", state);
    }
    // ==================================================================== connectedCallback
    connectedCallback() {
        if (this.shadowRoot) return;
        setTimeout(() => this.render());// make sure innerHTML is parsed
    }
    // ==================================================================== render
    render() {
        // ------------------------------------------------------------ helper functions
        let createElement = (tag, props = {}) => Object.assign(document.createElement(tag), props);

        // ------------------------------------------------------------ settings by attributes
        let dots = this.getAttribute("dots") || 15; // dotwidth in px, overruled by --dotwidth
        // ------------------------------------------------------------ create DOM
        this.attachShadow({ mode: "open" }).append(
            // ------------------------------------------------------------ create <style>
            createElement("style", {
                innerHTML:
                    // :host can be overruled with user css
                    ":host{position:relative;display:block;overflow:hidden;box-sizing:border-box}" +
                    ":host{--buttonwidth:2em}" +

                    ":host([hold]) slides-slot{cursor:grab}" +
                    ":host([scrollbar]) slides-slot{overflow-x:scroll}" +
                    ":host([nobutton]) button{display:none}" +
                    ":host([nodots]) slides-dots{display:none}" +

                    // slides
                    "::slotted(*){display:inline-flex;min-width:100%;scroll-snap-align:start}" +
                    //slides
                    "slides-slot{display:flex;margin:0;padding:0;width:100%;" +
                    "overflow:hidden;scroll-snap-type:x mandatory;scroll-behavior:smooth}" +
                    //button
                    "button{opacity:.3;position:absolute;top:50%;width:var(--buttonwidth);height:var(--buttonwidth);" +
                    "       font-size:3em;color:black;background:transparent;transform:translateY(-50%);" +
                    "       border:none;cursor:pointer}" +
                    //button hover
                    "button:hover{opacity:.7}" +
                    //dots
                    (dots ?
                        // dots
                        "slides-dots{height:var(--dotwidth," + dots + "px);display:flex;justify-content:center}" +
                        "slides-dots{position:absolute;bottom:" + dots * 1.3 + "px;width:100%;gap:" + dots + "px}" +
                        "slides-dots:hover{zoom:1.3}" +
                        // dot
                        "slides-dot{mix-blend-mode:overlay;display:inline-block;box-sizing:border-box}" +
                        "slides-dot{background:transparent;border-radius:50%;border:2px solid var(--dotbackground,beige)}" +
                        "slides-dot{opacity:var(--dotopacity,.8);width:var(--dotwidth," + dots + "px)}" +
                        "slides-dot:hover{opacity:1;cursor:pointer;background:var(--dotselect,beige)}" +
                        'slides-dot[part="dot current"]{background:var(--dotcurrent,white)}'
                        : "")
            }),// style.innerHTML
            // ------------------------------------------------------------ create prev button 
            this.prevbutton = createElement("button", {
                innerHTML: "<",//"&#9664;",
                id: "prev",
                part: "button prev",
                style: "left:0",
                onclick: () => this.prev(false), // buttons always go left or right
            }),
            // ------------------------------------------------------------ create part=slides
            this.slides = createElement("slides-slot", {
                part: "slides",
                innerHTML: "<slot></slot>",
                onmouseenter: () => this.hold = true,
                onmouseleave: () => this.hold = false,
            }),
            // ------------------------------------------------------------ create next button
            this.nextbutton = createElement("button", {
                innerHTML: ">",//"&#9654;",
                //innerHTML: '<svg width="50" height="50" viewBox="0 0 20 32"><path d="m16 16-9-9c-2-2-2-3 0-5 2-2 3-2 5 0l12 12c1 1 1 2 0 3l-12 12c-2 2-3 2-5 0-2-2-2-3 0-5l9-9z" fill="red"/></svg>',
                id: "next",
                part: "button next",
                style: "right:0",
                onclick: () => this.next(false), // buttons always go left or right
            }),
            // ------------------------------------------------------------ create dots
            this.dots = createElement("slides-dots", {
                part: "dots",
                render: () => {
                    this.dots.innerHTML = "";
                    this.dots.append(
                        ...Array(this.slidecount).fill().map((_, idx) =>
                            createElement("slides-dot", {
                                part: (idx == this.slide - 1) ? "dot current" : "dot",
                                onclick: () => this.slide = idx + 1,
                                onmouseenter: () => this.hold = true,
                                onmouseleave: () => this.hold = false,
                            })// createElement
                        )// map
                    );// append
                }// render
            })// this.dots
        );//append
        // ---------------------------------------------------------------- events
        this.tabIndex = 0;
        this.pointerEvents = "none";
        this.addEventListener("keyup", this);
        this.slides.addEventListener("scrollend", this);
        this.hasAttribute("rtl") && (this.slide = this.slidecount);
        // ----------------------------------------------------------------
        this.dots.render(); // first initial render
        // ----------------------------------------------------------------
        // setTimeout(() => this.next());
        if (this.hasAttribute("play"))
            setInterval(() => this.hasAttribute("hold") || this.next(),
                (~~this.getAttribute("play") || 3e3));
    } // connectedCallback
    // ==================================================================== handleEvent
    handleEvent(e) { // every Object has a default handleEvent method
        e.preventDefault();
        // console.warn(e.type, e.key, e.target);
        if (e.key == "ArrowLeft") this.prev();
        if (e.key == "ArrowRight") this.next();
        if (e.type == "scrollend") this.dots.render();
    }
});// customElement

// **************************************************************************** 
customElements.define("lorem-slides", class extends HTMLElement {
    connectedCallback() {
        let createElement = (el, props = {}) => (
            (el = document.createElement(el)).append(...(props.appends || [])),
            delete props.appends,
            Object.assign(el, props)
        );
        let pics = (this.getAttribute("pics") || "21,22,23,24").split(",").slice(0, 4);
        this.replaceWith(...pics.map((n, i) => {
            let src = `https://picsum.photos/id/${n}/640/360`;
            return createElement("div", {
                style: "margin:0;padding:0;background:red;margin-top:-5em;",
                appends: [
                    createElement("img", {
                        src,
                        style: "width:100%;",
                        loading: "lazy",
                        onload: () => console.log("<slide-viewer> loaded slide ", i + 1, "of", pics.length),
                    })
                ]
            })
        }));
    }
});