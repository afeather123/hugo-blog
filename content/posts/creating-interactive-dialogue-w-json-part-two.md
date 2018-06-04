---
title: "Creating Interactive Dialogue in Javascript with JSON: Part 2"
date: 2018-06-03T11:59:26-07:00
draft: false
---

In the last section, we got familiar with the problem and laid out what we're trying to do; we talked about text nodes and how they store the dialogue, and either information about how to transition to the next node, or information about the choices to present the user with. 

Now, let's get into writing the code to work on that file. To start we are going to focus on writing the code that iterates over the file, and then we will create the GUI with buttons and text afterwards. Focusing on the logic without worrying about how we will display the output will help us to think about the core of the problem instead of getting caught up in the domain specific stuff; in this case we will be using DOM manipulation to make changes to the text and add buttons but in other cases we might want to do something completely different, like if we were using a [javascript game engine or graphics rendering library](https://github.com/collections/javascript-game-engines). By maintaining a [seperation of concerns](https://en.wikipedia.org/wiki/Separation_of_concerns) between our code that handles iterating over the file and our code that handles displaying the information to the user, we will end up with something that is a lot more flexible and reusable for other projects in the future.

Let's start by defining a Story class which will take the parsed JSON data as an argument for its constructor. We'll define a few methods on it; NextNode for when the node doesn't present multiple choices to the user, MakeChoice for when it does, and Subscribe, which is how our story class will communicate with other objects; another object will be able to pass in a callback function which will be called with the next nodes data as its parameter whenever NextNode or MakeChoice are called.

{{< highlight javascript >}}

class Story {
    constructor(story_data) {
        this.variables = story_data.variables;
        this.start = story_data.start;
        this.nodes = story_data.nodes;
        this.subscribers = [];
    }

    // Subscribe is how our story object will communicate with other parts of our program. You can pass in a callback
    // function into Subscribe, and that callback function will be called whenever NextNode is called to get the
    // Next part of our dialogue.
    Subscribe(callback) {
        this.subscribers.push(callback);
    }

    // This function is used by NextNode to pass the new_node to all of the subscribers listening for information about it
    NotifySubscribers(node_data) {
        this.subscribers.forEach(subscriber => {
            subscriber(node_data);
        })
    }

    NextNode(node_name) {
        // This function will take in the name of the node, then check the conditions of that nodes redirects (if there are any)
        // To find the correct redirect, then 
    }

    MakeChoice(choice) {
        // This function will take in a choice object, then set the conditions in choice.set_conditions if they exist,
        // And call NextNode with the node_name of the choices redirect 
    }

    Start() {
        // This function will call next node with the starting node
        this.NextNode(this.start);
    }
}

{{< / highlight >}}

Let's start off by getting the NextNode and Start functions working first. [Here's](/json/testRedirects.json) the data I'll be using to test out our code. There are two variables, "haveCar" and "carWorks". When asked "Hey, do you think you could give me a ride?", if both are true, the response will be "Sure, why not!"; if we have a car but its not working, we will reply with "Sorry, my cars not working right now."; finally, if "haveCar" is set to false we will reply with "Sorry, I don't have a car." No choices yet; we'll have to test that its working by manually changing the variables in the file, but don't worry, we'll get there. [Here's](https://github.com/afeather123/story_interpreter_redirect_exercise) a starter repository to use as a base. Even though this code will eventually run in the browser, for now I'll be testing it with node for conveniences sake.

So NextNode has to take in the name of a node, and then return an object with the data of that node, if it has redirect(s), the first valid redirect of that node, and if it has choices, the choices of that node. Since there's nothing to simply returning the data and the choices, let's focus on finding a valid redirect to return it. The object that should be passed into the callback when "haveCar" and "carWorks" are true should look like:

{{< highlight javascript >}}

{
    data: {
        text: "Hey, do you think you could give me a ride?",
        response_text: "Oh..."
    },
    redirect: {
        "node_name": "yes",
        "conditions": [
            {
                "variable": "haveCar",
                "operator": "=",
                "value": true
            },
            {
                "variable": "carWorks",
                "operator": "=",
                "value": true
            }
        ]
    }
}

{{< / highlight >}}

Notice that we simply take the redirect and pass it in instead of only passing the node_name which, in this case, is the only piece of information necessary; the conditions are for internal use only and won't be used by the GUI. Though it might simplify things slightly in the short term to only pass back the node_name, passing the whole object will allow us to pass other data with it in the future if we decide to.

I reccomend stopping here and trying it out yourself. I've included a test file you can run to see if its NextNode passes the appropriate output to the listeners.

<br>
<br>
<br>
<br>
<br>
<br>
<br>
<br>
<br>
<br>
<br>
<br>
<br>
<br>

...Done? Ok, let's go over how I approached the problem. First we need a way to check if a condition is valid or not. I wrote a function that takes in a single condition and checks it based on its operator.

{{< highlight javascript >}}

CheckCondition(condition) {
    const value = this.variables[condition.variable];
    switch(condition.operator) {
        case '=': return value === condition.value;
            break;
        case '!=': return value !== condition.value;
            break;
        case '<': return value < condition.value;
            break;
        case '>': return value > condition.value;
            break;
        case '<=': return value <= condition.value;
            break;
        case '>=': return value >= condition.value;
            break;
        default: console.log('Invalid operator');
    }
}

{{< / highlight >}}

Technically to get the tests to work, you only needed to get the <= operator working, by why not get all the other math operators working while we're at it, since they're all essentially the same? Since a redirect can have multiple conditions, we then need to write a function to check if a set of conditions is valid.

{{< highlight javascript >}}

CheckConditionSet(conditions) {
    for(let i = 0; i < conditions.length; i++) {
        if(!this.CheckCondition(conditions[i])) return false;
    }
    return true;
}

{{< / highlight >}}

Now we can write the function that returns the fist valid redirect.

{{< highlight javascript >}}

GetValidRedirect(redirects) {
    for(let i = 0; i < redirects.length; i++) {
        if (redirects[i].conditions) {
            if(this.CheckConditionSet(redirects[i].conditions)) return redirects[i];
        } else {
            return redirects[i];
        }
    }
    console.log("No valid redirects found.")
}

{{< / highlight >}}

Checking if the object has conditions allows for a default case that can be placed at the end, which can save some typing. Finally, let's write NextNode itself: 

{{< highlight javascript >}}

NextNode(node_name) {
    const node = this.nodes[node_name];
    if(!node) {
        console.log("Invalid node name");
        return;
    }
    let outputNode = {};
    outputNode.data = node.data;
    if(node.redirects) {
        outputNode.redirect = this.GetValidRedirect(node.redirects);
    }
    if(node.choices) {
        outputNode.choices = node.choices;
    }
    this.NotifySubscribers(outputNode);
    return outputNode;
}

{{< / highlight >}}

And that's it! The functions we wrote do most of the heavy lifting; all that's left to do is construct out output object and pass it to the subscribers. It's definitely also possible to take all of these functions and throw them into NextNode with nested for loops, but I think breaking it into multiple functions makes it look much more readable, and will allow us to re-use some of these functions as we extend the functionality of our program (which we will!). Our story is now techincally dynamic, changing with the variables of the inital state; but since there's no way to change variables with user input, there's no way they'd ever know. In the next section, we'll be adding choices.