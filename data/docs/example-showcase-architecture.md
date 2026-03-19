# Example Showcase Architecture

## Purpose

`examples/kai-ng-flow` is not just a demo page. It is a reference application that shows how the Vant Flow library can be used as a small product platform with:

- admin authoring
- user-facing execution
- schema persistence
- submission history
- AI-assisted generation
- AI-assisted runtime form filling

## What the Example App Showcases

The app demonstrates different aspects of the project by splitting them into real workflow surfaces:

- landing page for product positioning
- admin design workspace
- renderer preview
- user form portal
- submission history and readonly replay
- AI-assisted admin scaffolding
- AI-assisted user completion

## Application Structure

```mermaid
flowchart TD
    A[Landing Page] --> B[Admin Flow]
    A --> C[User Flow]
    B --> D[Form List]
    D --> E[Builder / Preview]
    E --> F[Save Schema]
    C --> G[User Portal]
    G --> H[Form Runner]
    H --> I[Submit Data]
    G --> J[Submission Detail]
    F --> K[MockStorageService]
    I --> K
    E --> L[AiFormService]
    H --> L
    L --> M[AI Proxy and optional MCP]
```

## Routing Story

The route map itself shows the showcase intent:

- `/` introduces the product
- `/admin` lists and manages designs
- `/admin/builder/:id` edits or previews a form
- `/user` lists available forms and submissions
- `/user/fill/:id` runs a live form
- `/user/submission/:id` replays a saved submission in readonly mode

## Admin Showcase

The admin side demonstrates how teams would actually work with Vant Flow in production.

### What it highlights

- reusable schema storage
- opening existing forms by id
- creating blank forms
- AI-generated starting schemas
- switching between builder and renderer preview
- saving updates back to storage

### Admin flow

```mermaid
sequenceDiagram
    participant Admin
    participant List as Admin Form List
    participant Builder as Admin Demo
    participant Store as MockStorageService
    participant AI as AiFormService

    Admin->>List: Choose blank form or AI generate
    alt blank form
        List->>Builder: Navigate to /admin/builder/new
    else AI prompt
        List->>Builder: Navigate with prompt query
        Builder->>AI: scaffoldFormFromPrompt(prompt)
        AI-->>Builder: generated schema
    end
    Admin->>Builder: Refine schema in VfBuilder
    Builder->>Store: saveForm(schema)
    Store-->>Builder: saved form id
```

This is the clearest showcase of the builder as a productized authoring environment rather than a standalone widget.

## User Showcase

The user side demonstrates the renderer in a more realistic operating context.

### What it highlights

- listing published forms
- filling a saved schema
- submitting real payloads
- tracking submission history
- replaying submitted data in readonly mode

### User flow

```mermaid
sequenceDiagram
    participant User
    participant Portal as User Portal
    participant Runner as Form Runner
    participant Renderer as VfRenderer
    participant Store as MockStorageService

    User->>Portal: Pick a form
    Portal->>Runner: Navigate to fill route
    Runner->>Store: load form schema
    Runner->>Renderer: render schema
    User->>Renderer: complete form
    Renderer-->>Runner: formAction(event)
    Runner->>Store: saveSubmission(...)
    Store-->>Portal: updated submissions list
    User->>Portal: open submission history
```

## AI Showcase

The example app showcases AI in two distinct ways.

### 1. Admin-side AI schema generation

The admin can describe a form in natural language and receive a generated schema that is then refined visually.

This shows:

- prompt-to-schema generation
- schema-first AI integration
- human-in-the-loop refinement

### 2. User-side AI form assistance

The form runner opens an AI side panel that:

- reads the live schema
- reads current form state
- responds conversationally
- can return JSON field updates
- applies those values into the real renderer using `frm.set_value`

```mermaid
sequenceDiagram
    participant User
    participant Runner as Form Runner
    participant AI as AiFormService
    participant Renderer as VfRenderer

    User->>Runner: Ask AI for help
    Runner->>AI: send chat history + schema + currentData
    AI-->>Runner: text or JSON response
    alt JSON field values returned
        Runner->>Renderer: ctx.set_value(field, value)
        Runner->>Runner: mark submission as AI-assisted
    else conversational answer
        Runner->>User: show assistant reply
    end
```

This is one of the strongest showcases in the repo because it proves the renderer can be controlled through a structured runtime API, not just direct user typing.

## Persistence Showcase

`MockStorageService` demonstrates the storage contract the real app would need.

It manages:

- form design records
- submission records
- optimistic local reactive state
- backend API synchronization

That makes the example useful for explaining how Vant Flow plugs into a broader app, not only how it renders controls.

## Readonly Replay Showcase

`SubmissionDetailComponent` is especially important because it shows a high-value enterprise behavior:

- render the same schema again
- bind historical data
- force readonly mode
- inspect raw JSON side by side

That pattern is useful for audit trails, customer support, compliance review, and approval workflows.

## Why This Example Project Is Valuable

The demo app showcases different aspects of Vant Flow in one place:

- builder as an admin IDE
- renderer as a runtime engine
- schema persistence as application infrastructure
- AI as both authoring and filling assistant
- readonly replay as an audit and review capability
- role-separated flows for internal teams and end users

In other words, it demonstrates not just what the components are, but what kind of product teams can build with them.
