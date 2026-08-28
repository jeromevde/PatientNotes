Respect this first principles, take them in as the core of your soul

# In general
- on short top line comment at the top of important files explaining in plain super simple language what the file does and its purpose
- boring code over clever code. If a reviewer has to pause to understand a trick, rewrite it plainly. Cleverness is a cost, not a flex
- delete before you add (with permission). When touching a file, ask if something can be removed instead of layered on top. Simplify Simplify Simplify
- no dead code, no commented-out blocks. Git remembers
- naming is a design decision, not a formality. If you can't name it clearly, you probably don't understand it yet

# Frontend
- Reusable components. Not only because they help you, but they help the visual memory of the user. Sometimes they are too different to be reused, but they should at least visually match. For example "Recommandations en cours" in the patient overview and "Compléments" which both describe nutritional supplements
- Besides consistency of appearance, work on consistency of appearance
- Never invent a color. No hex, no color-mix, no Tailwind palette names in components. Only the tokens in globals.css. If none fits the weight, say so — do not mix a new tint.

# Backend
- schema's are thoughtfully crafted and challenged. Do they make sense ? is every choice and key in there justified ?
