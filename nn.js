$(document).ready(function() {
    var parents = [];

    var weights = {
        // input layer to hidden layer
        i1h1: 0, i1h2: 0, i1h3: 0, i1h4: 0, i1h5: 0,
        i2h1: 0, i2h2: 0, i2h3: 0, i2h4: 0, i2h5: 0,
        i3h1: 0, i3h2: 0, i3h3: 0, i3h4: 0, i3h5: 0,
        i4h1: 0, i4h2: 0, i4h3: 0, i4h4: 0, i4h5: 0,
        i5h1: 0, i5h2: 0, i5h3: 0, i5h4: 0, i5h5: 0,
        i6h1: 0, i6h2: 0, i6h3: 0, i6h4: 0, i6h5: 0,
        i7h1: 0, i7h2: 0, i7h3: 0, i7h4: 0, i7h5: 0,
        i8h1: 0, i8h2: 0, i8h3: 0, i8h4: 0, i8h5: 0,
        i9h1: 0, i9h2: 0, i9h3: 0, i9h4: 0, i9h5: 0,
        // hidden layer to output layer
        h1o1: 0, h1o2: 0, h1o3: 0,
        h2o1: 0, h2o2: 0, h2o3: 0,
        h3o1: 0, h3o2: 0, h3o3: 0,
        h4o1: 0, h4o2: 0, h4o3: 0,
        h5o1: 0, h5o2: 0, h5o3: 0,
    };

    var nodes = {
        input: { i1: 0, i2: 0, i3: 0, i4: 0, i5: 0, i6: 0, i7: 0, i8: 0, i9: 0 },
        hidden: { h1: 0, h2: 0, h3: 0, h4: 0, h5: 0 },
        output: { o1: 0, o2: 0, o3: 0 }
    };

    window.randomizeWeights = function() {
        function chooseParent(numberOfParents) {
            return (Math.random()<.5) ? 0 : 1;
        }

        if (parents.length < 2) {
            for (i in weights) {
                weights[i] = Math.random();
            }
        } else if (parents.length == 2) {
            console.log("Parents", parents);
            for (i in weights) {
                weights[i] = parents[chooseParent(2)][i];
                // random mutation on 1/10th of genes
                if (Math.random()<.1) {
                    weights[i] = Math.random();
                }
            }
            console.log("Child", weights);
        }
    }

    function toHiddenLayer() {
        for (h in nodes.hidden) {
            nodes.hidden[h] = 0;
            for (i in nodes.input) {
                weight = i.concat(h);
                nodes.hidden[h] += nodes.input[i] * weights[weight];
            }
        }
    }

    function toOutputLayer() {
        for (o in nodes.output) {
            nodes.output[o] = 0;
            for (h in nodes.hidden) {
                weight = h.concat(o);
                nodes.output[o] += nodes.hidden[h] * weights[weight];
            }
        }
    }

    function propagate() {
        toHiddenLayer();
        toOutputLayer();
    }

    window.NN = {

        getWeights: function() {
            return weights;
        },

        randomize: function() {
            randomizeWeights();
        },

        io: function(NNInput) {
            for (i in NNInput) {
                nodes.input[i] = NNInput[i];
            }
            propagate();
            return nodes.output;
        },

        setParents: function(parentsWeights) {
            parents = parentsWeights;
        }

    };

});
