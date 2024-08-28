module StippleWaferPlot

using Stipple, StippleUI.API

export waferplot

const assets_config = Genie.Assets.AssetsConfig(package="StippleWaferPlot.jl")

import Stipple.Genie.Renderer.Html: register_normal_element, normal_element

register_normal_element("st__waferplot", context=@__MODULE__)


function waferplot(;kwargs...)
    st_waferplot(;kw([kwargs...])...)
end

function gb_component_routes()
    package_subpath_part = "stipplewaferplot" # change these, keep the other parts as defined below

    # don't change these
    # GenieDevTools identifies the components by their asset path, which must be of the form /components/stipplemarkdown/gb_component/
    prefix = "components"
    gb_component_path = "gb_component"
    assets_folder_path = "$package_subpath_part/$gb_component_path"
    icons_folder_path = "icons"

    [
    Genie.Router.route(Genie.Assets.asset_route(
        assets_config,
        "", # type
        file="definitions.json",
        path=assets_folder_path,
        prefix=prefix,
        ext=""
    ),
    named=:get_gb_component_stipplewaferplot_definitionsjson) do
        Genie.Renderer.WebRenderable(
            Genie.Assets.embedded(
                Genie.Assets.asset_file(cwd=normpath(joinpath(@__DIR__, "..")),
                file="definitions.json",
                path=gb_component_path,
                type="")
            ),
            :json) |> Genie.Renderer.respond
    end

    Genie.Router.route(Genie.Assets.asset_route(
        assets_config,
        "", # type
        file="canvas.css",
        path=assets_folder_path,
        prefix=prefix,
        ext=""
    ),
    named=:get_gb_component_stipplewaferplot_canvascss) do
        Genie.Renderer.WebRenderable(
            Genie.Assets.embedded(
                Genie.Assets.asset_file(cwd=normpath(joinpath(@__DIR__, "..")),
                file="canvas.css",
                path=gb_component_path,
                type="")
            ),
            :css) |> Genie.Renderer.respond
    end

    Genie.Router.route(Genie.Assets.asset_route(
        assets_config,
        "", # type
        file="library_icon.png",
        path="$assets_folder_path/$icons_folder_path",
        prefix=prefix,
        ext=""
    ),

    named=:get_gb_component_stipplewaferplot_icons_stipplewaferplot) do
        Genie.Renderer.WebRenderable(
            Genie.Assets.embedded(
                Genie.Assets.asset_file(cwd=normpath(joinpath(@__DIR__, "..")),
                file="library_icon.png",
                path=joinpath(gb_component_path, icons_folder_path),
                type="")
            ),
            :png) |> Genie.Renderer.respond
    end
    ]
end

function deps_routes()
    haskey(ENV, "GB_JULIA_PATH") && gb_component_routes()

    Genie.Assets.external_assets(Stipple.assets_config) && return nothing
    
    Genie.Router.route(Genie.Assets.asset_route(assets_config, :js, file="02_stipplewaferplot"), named=:get_stipplewaferplotjs) do
        Genie.Renderer.WebRenderable(
            Genie.Assets.embedded(Genie.Assets.asset_file(cwd=normpath(joinpath(@__DIR__, "..")), file="02_stipplewaferplot.js")),
            :javascript) |> Genie.Renderer.respond
    end

    Genie.Router.route(Genie.Assets.asset_route(assets_config, :js, file="01_three.umd"), named=:get_threejs) do
        Genie.Renderer.WebRenderable(
            Genie.Assets.embedded(Genie.Assets.asset_file(cwd=normpath(joinpath(@__DIR__, "..")), file="01_three.umd.js")),
            :javascript) |> Genie.Renderer.respond
    end
    
    Genie.Router.route(Genie.Assets.asset_route(assets_config, :js, file="01_three.umd"), named=:get_threejs) do
        Genie.Renderer.WebRenderable(
            Genie.Assets.embedded(Genie.Assets.asset_file(cwd=normpath(joinpath(@__DIR__, "..")), file="01_three.umd.js")),
            :javascript) |> Genie.Renderer.respond
    end

    Genie.Router.route(Genie.Assets.asset_route(assets_config, :css, file="waferplot"), named=:get_stipplewaferplotcss) do
        Genie.Renderer.WebRenderable(
            Genie.Assets.embedded(Genie.Assets.asset_file(cwd=normpath(joinpath(@__DIR__, "..")), type="css", file="waferplot.css")),
            :css) |> Genie.Renderer.respond
    end

    nothing
end

function css_deps()
    [
        Stipple.Elements.stylesheet(Genie.Assets.asset_path(assets_config, :css, file="waferplot"))
    ]
end

function deps()
    [
        Genie.Renderer.Html.script(src=Genie.Assets.asset_path(assets_config, :js, file="01_three.umd")),
        Genie.Renderer.Html.script(src=Genie.Assets.asset_path(assets_config, :js, file="02_stipplewaferplot"))
    ]
end

function __init__()
    deps_routes()
    Stipple.add_css(css_deps)
    Stipple.deps!(@__MODULE__, deps)
end

end
