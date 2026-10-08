<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Use GlassCard for framed surfaces across content routes and a single root LiquidAmbient color field; shared materials keep depth consistent without duplicating expensive filters.
- Use Framer Motion springs on shared Button controls and interactive GlassCard surfaces, with reduced-motion support; avoid global transforms that interfere with chess dragging.
