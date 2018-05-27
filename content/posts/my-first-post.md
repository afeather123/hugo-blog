---
title: "My First Post"
date: 2018-05-26T20:41:13-07:00
draft: true
tags: ["godot", "game_development", "gamedev"]
---

This is my first post oh BABY!

{{< highlight gd >}}
func load_file_as_JSON(path):
	var file = File.new()
	file.open(path, file.READ)
	var content = (file.get_as_text())
	file.close()
	return parse_json(content)
{{< / highlight >}}

This is a piece of GDScript right here. Would you look at that!