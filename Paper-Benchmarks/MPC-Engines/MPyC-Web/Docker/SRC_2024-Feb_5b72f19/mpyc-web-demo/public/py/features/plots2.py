from termgraph.module import Args, BarChart, Colors, Data

data = Data([[765, 787], [781, 769]], ["6th G", "7th G"], ["Boys", "Girls"])
chart = BarChart(
    data,
    Args(
        title="Total Marks Per Class",
        colors=[Colors.Red, Colors.Magenta],
        space_between=True,
    ),
)

chart.draw()
