import os
import sys
import webview


def resource_path(relative_path):
    base_path = getattr(sys, "_MEIPASS", os.path.dirname(os.path.abspath(__file__)))
    return os.path.join(base_path, relative_path)


if __name__ == "__main__":
    index_path = resource_path("index.html")
    window = webview.create_window(
        "Ultimate Pokemon Quiz",
        index_path,
        width=900,
        height=900,
        min_size=(500, 600),
    )
    webview.start()
