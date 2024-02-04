customElements.define("slide-viewer", class extends HTMLElement {
    get slidecount() {
        return this.children.length;
    }
    prev(reverse = this.reverse) {
        this.reverse = reverse;
        this.slidenumber--;
    }
    next(reverse = this.reverse) {
        this.reverse = reverse;
        let nr = this.slidenumber;
        if (reverse) {
            this.slidenumber = (nr > 1) ? nr - 1 : ((this.reverse = false), nr + 1);
        } else {
            this.slidenumber = (nr < this.slidecount) ? nr + 1 : ((this.reverse = true), nr - 1);
        }
    }
    get reverse() {
        return this.hasAttribute("reverse");
    }
    set reverse(state) {
        this.toggleAttribute("reverse", state);
    }
    get slidenumber() {
        let idx = [...this.children].indexOf(this.slide());
        return idx >= 0 ? idx + 1 : -1;
    }
    set slidenumber(nr) {
        if (nr < 1) nr = this.slidecount;
        let slide = this.children[nr - 1];
        slide && (this.slides.scrollLeft = slide.offsetLeft - this.slides.offsetLeft);
    }
    slide() {
        for (let child of this.children) {
            let start = child.offsetLeft;
            let end = child.offsetWidth + start;
            let mid = this.slides.scrollLeft + this.slides.clientWidth / 2;
            if (start <= mid && end >= mid) return child;
        }
        console.error("no slide found!");
    }
    connectedCallback() {
        if (this.shadowRoot) return;
        setTimeout(() => this.render(), 200);// make sure innerHTML is parsed
    }
    render() {
        console.log("render", this.innerHTML.length, this.children.length);
        let createElement = (tag, props = {}) => Object.assign(document.createElement(tag), props);
        this.attachShadow({ mode: "open" }).append(
            createElement("style", {
                innerHTML:
                    ":host{position:relative;display:block;--dotwidth:2em}" +
                    ":host([hold]) #slides{cursor:grab}" +
                    ":host([scrollbar]) #slides{overflow-x:scroll}" +
                    "::slotted(*){display:block;min-width:100%;scroll-snap-align:start}" +
                    //slides
                    "#slides{position:relative;display:flex;margin:0;padding:0;width:100%;" +
                    "overflow-x:hidden;overflow-y:hidden;" +
                    "scroll-snap-type:x mandatory;scroll-behavior:smooth}" +
                    //button
                    "button:hover{opacity:.7}" +
                    "button{position:absolute;top:50%;width:10%;height:20%;transform:translateY(-50%);" +
                    "font-size:3em;border-radius:25%;" +
                    "opacity:.2;color:grey;border:none;cursor:pointer;z-index:2}" +
                    //output
                    "output{position:absolute;bottom:0;width:100%;" +
                    "background:none;text-align:center;padding-bottom:1em;font-size:2em}" +
                    //dots
                    "#dots{display:flex;justify-content:center;gap:1em;position:absolute;bottom:0;width:100%;height:var(--dotwidth);margin-bottom:.4em}" +
                    ".dot{display:inline-block;background:black;opacity:.5;width:var(--dotwidth);border-radius:50%;filter:contrast(1)}" +
                    ".dot:hover{opacity:1;cursor:pointer;}"
            }),
            this.prevbutton = createElement("button", {
                innerHTML: "&#9664;",
                part: "button prev",
                style: "left:0",
                onclick: () => this.prev(false),
            }),
            this.slides = createElement("div", {
                id: "slides",
                part: "slides",
                innerHTML: "<slot></slot>",
                onmouseenter: () => (this.setAttribute("hold", ""), this.slides.focus()),
                onmouseleave: () => this.removeAttribute("hold"),
            }),
            this.nextbutton = createElement("button", {
                innerHTML: "&#9654;",
                part: "button next",
                style: "right:0",
                onclick: () => this.next(false),
            }),
            this.counter = createElement("output", {
                innerHTML: "0 of 0",
                part: "counter",
                ariaLive: "polite",// https://www.w3.org/WAI/tutorials/carousels/functionality/
                ariaAtomic: "true",
                // --------------------------------------------------------------------------
                render: () => {
                    this.counter.innerHTML = this.slidenumber + " of " + this.slidecount;
                    this.dots.innerHTML = "";
                    this.dots.append(
                        ...Array(this.slidecount).fill().map((_, i) => {
                            return createElement("div", {
                                className: "dot",
                                style: i == this.slidenumber - 1 ? "opacity:1;background:beige" : "",
                                part: "dot",
                                //style: "left:" + (i * 10) + "%",
                                onclick: () => this.slidenumber = i + 1,
                            });
                        })
                    );
                }
                // --------------------------------------------------------------------------
            }),
            this.dots = createElement("div", {
                id: "dots",
                part: "dots",
            })
        );//append
        // --------------------------------------------------------------------------
        // --------------------------------------------------------------------------
        this.tabIndex = 0;
        this.pointerEvents = "none";
        this.addEventListener("keyup", this);
        this.slides.addEventListener("scrollend", this);
        // --------------------------------------------------------------------------
        this.counter.render();
        // --------------------------------------------------------------------------
        // setTimeout(() => this.next());
        if (this.hasAttribute("play")) {
            console.warn("autoplay", this.getAttribute("play"));
            setInterval(() => {
                if (!this.hasAttribute("hold")) this.next();
            }, (~~this.getAttribute("play") || 1e3));
        }
    }
    handleEvent(e) {
        e.preventDefault();
        // console.warn(e.type, e.key, e.target);
        if (e.key == "ArrowLeft") this.prev();
        if (e.key == "ArrowRight") this.next();
        if (e.type == "scrollend") this.counter.render();
    }
});

customElements.define("lorem-slides", class extends HTMLElement {
    connectedCallback() {
        let createElement = (tag, props = {}) => Object.assign(document.createElement(tag), props);
        let pics = (this.getAttribute("pics") || "21,22,23,24").split(",").slice(0, 4);
        this.replaceWith(...pics.map((n, i) => {
            return createElement("img", {
                src: `https://picsum.photos/id/${n}/640/360`,
                style: "width:100%;",
                loading: "lazy",
                onload: () => console.log("loaded", i + 1, "of", pics.length),
            });
        }));
    }
});