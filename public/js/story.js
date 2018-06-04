export class Story {
    constructor(story_data) {
        this.initialState = JSON.stringify(story_data.variables);
        this.story_data = story_data;
        this.data_listeners = [];
        this.redirect_listeners = [];
        this.choice_listeners = [];
    }

    Start() {
        this.NextNode(this.story_data.start);
    }

    Reset() {
        this.story_data.variables = JSON.parse(this.initialState);
    }

    MakeChoice(choice) {
        if(choice.set_conditions) {
            this.SetVariables(choice.set_conditions);
        }
        let redirect = this.GetValidRedirect(choice.redirects);
        this.NextNode(redirect.node_name);
        console.log(this.story_data.variables);
    }

    NextNode(nodeName) {
        const node = this.story_data.nodes[nodeName];
        const data = {};
        if(node.choices) {
            let validChoices = [];
            node.choices.forEach(choice => {
                if(choice.conditions) {
                    if(this.CheckConditionSet(choice.conditions)) {
                        validChoices.push(choice);
                    }
                } else {
                    validChoices.push(choice);
                }
            })
            data.choices = validChoices;
        }
        if(node.redirects) {
            console.log(node.redirects);
            data.redirect = this.GetValidRedirect(node.redirects).node_name;
        }
        data.data = node.data;
        this.SendData(data);
        if(node.set_conditions) {
            this.SetVariables(node.set_conditions);
        }
    }

    GetValidRedirect(redirects) {
        for(let i = 0; i < redirects.length; i++) {
            if(redirects[i].conditions) {
                if(this.CheckConditionSet(redirects[i].conditions)) {
                    return redirects[i];
                }
            } else {
                return redirects[i];
            }
        }
        console.error("No valid redirect found! Check your script for inconsistencies!");
    }

    SetVariables(setters) {
        setters.forEach(setter => {
            this.SetVariable(setter);
        })
    }

    SetVariable(setter) {
        switch (setter.operator) {
            case '=':
                this.story_data.variables[setter.variable] = setter.value;
                break;
            case '*=':
                this.story_data.variables[setter.variable] *= setter.value;
                break;
            case '/=':
                this.story_data.variables[setter.variable] /= setter.value;
                break;
            case '+=':
                this.story_data.variables[setter.variable] += setter.value;
                break;
            case '-=':
                this.story_data.variables[setter.variable] -= setter.value;
                break;
            case 'toggle':
                this.story_data.variables[setter.variable] != storydata.variables[setter.var];
                break;
            case 'random':
                this.story_data.variables[setter.variable] = Math.floor(Math.random() * setter.value);
                break;
            default:
                console.log('Invalid operator');
            }
    }

    CheckCondition(condition) {
        switch(condition.operator) {
            case '=':
                return this.story_data.variables[condition.variable] === condition.value;
                break;
            case '>':
                return this.story_data.variables[condition.variable] > condition.value;
                break;
            case '<':
                return this.story_data.variables[condition.variable] < condition.value;
                break;
            case '>=':
                return this.story_data.variables[condition.variable] >= condition.value;
                break;
            case '<=':
                return this.story_data.variables[condition.variable] <= condition.value;
                break;
            case '!=':
                return this.story_data.variables[condition.variable] !== condition.value;
                break;
            default: console.log('Invalid operator');
        }
    }

    CheckConditionSet(conditions) {
        for (let i = 0; i < conditions.length; i++) {
            if(!this.CheckCondition(conditions[i])) return false;
        }
        return true;
    }

    SubscribeData(callback) {
        this.data_listeners.push(callback);
    }

    SendData(data) {
        this.data_listeners.forEach(listener => {
            listener(data);
        })
    }
}