Visualisations are done using [D3](https://d3js.org). These allow for more fine-grained control over the exact design/animation of the visualisations (with direct access to CSS controls, etc).

# High-level view

![high_level_view_viz](media/high_level_view_viz.svg)
%%[🖋 Edit in Excalidraw](high_level_view_viz.svg)%%

Generally, the BaseVisualisation component will act as a template for all the visualisation, abstracting away shared components across all visualisations like the data, capabilities of controls, and layout.

![example_viz](example_viz.svg)
%%[🖋 Edit in Excalidraw](example_viz.md)%%

Note that the reason why the functions for rendering are not separate components by themselves, and have to be functions passed down to be rendered is as D3 is mostly inline - and using external components would need it to use `externalRef`, which would not be ideal for some of the capabilities such as recording.

The capabilities are implemented at a lower level so that there is no need for reimplementation in future visualisations.

# BaseVisualisation as a template

> [!note]
> This refers to the `visualisation/BaseVisualisation` component, and not any base visualisation components used for further customisation for specific models.

```typescript
interface BaseVisualisationProps {
    // Core configuration
    dataConfig: VisualisationDataConfig;
    capabilities: VisualisationCapabilities;
    // Optional configurations
    styleConfig?: VisualizationStyleConfig;
    controlsConfig?: VisualizationControlsConfig;
    layoutConfig?: VisualizationLayoutConfig;
    eventHandlers?: VisualizationEventHandlers;
}
```

Generally, the `BaseVisualisation` take in these information, which are separated into different sub-records/dictionaries of configurations. Due to the high customisability, the configs are separated into separate types for easy extension in the future.

-   `dataConfig` contains all necessary information to display the data such as
    -   the actual data itself
    -   the render function used for the visualisation, to display the data
-   `capabilities` contains all the information on what capabilities the visualisation should have
    -   the big categories of the keys are all the different capabilities - if they exist in the argument, then the visualisation has that capability.
    -   the values are the parameters for the different visualisations
-   `styleConfig` is optional parameter for styling on the visualisation
-   `controlsConfig` is optional parameter for styling of the control bar for the capabilities
-   `layoutConfig` is optional parameter for extra layout items
-   `eventHandlers` is optional parameter for event handlers like to handle stepping when playing an animation

# Controls

The current controls supported are:

-   zooming
-   animation (playing)
-   export
    -   to SVG/PNG (still)
    -   to webm
