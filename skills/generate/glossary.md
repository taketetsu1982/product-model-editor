# Glossary

Terms based on OOUI (Object-Oriented User Interface) methodology.

| Term | Definition |
|---|---|
| Object | A domain entity that users perceive and act on. Has multiple instances sharing common properties and actions. The "noun" in the noun-verb interaction paradigm. |
| Property (Field) | An attribute of an Object displayed in a Pane (e.g., name, status, date). Stored as `fields` in JSON. |
| Action (Verb) | An operation performed on an Object (e.g., create, edit, delete). Stored as `verbs` in JSON. Actions are always placed on a Pane, never as standalone menu items. |
| Pane | The minimum display unit showing one Object in a specific format (Collection or Single). Not a screen — devices combine multiple Panes into one screen. Stored as `views` in JSON. |
| Collection | A Pane type that lists multiple instances of the same Object, showing key properties. |
| Single | A Pane type that displays one Object instance in detail, typically with more properties than a Collection. |
| View | The presentation layer as a whole — the set of all Panes. In JSON, `views` is the array containing Pane definitions. |
| Transition | Navigation from one Pane to another, triggered by a user action (e.g., tapping a row). |
| Relation | A directional association between Objects (parent → child). Defined only in one direction to avoid duplicate lines. |
| Actor | A user role (e.g., Admin, Member) that defines which Objects are accessible. |
