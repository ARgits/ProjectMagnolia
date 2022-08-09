// activeToken - your controlled token
function checkTokens(activeToken) {
    const uuid = activeToken.uuid;
    const bounds = activeToken.object.bounds;
    /*TL - Top Left
      TR - Top Right
      BL - Bottom Left
      BR - Bottom Right*/
    const corners = {
        TL: { x: bounds.left, y: bounds.top },
        TR: { x: bounds.right, y: bounds.top },
        BL: { x: bounds.left, y: bounds.bottom },
        BR: { x: bounds.right, y: bounds.bottom }
    };
//iterate through all tokens on scene
    for (const token of canvas.scene.tokens) {
        if (token.uuid !== uuid) //skip controlled token
        {
            let pointName = "";
            const tBounds = token.object.bounds;
            const targetPoints = {
                TL: { x: tBounds.left, y: tBounds.top },
                TR: { x: tBounds.right, y: tBounds.top },
                BL: { x: tBounds.left, y: tBounds.bottom },
                BR: { x: tBounds.right, y: tBounds.bottom }
            };
//check which corner is closest to target
            pointName += activeToken.y - token.y >= 0 ? "T" : "B";
            pointName += activeToken.x - token.x >= 0 ? "R" : "L";
//make an array of 3 distances (example: if closest Top Left (TL), then we calculate distance between target's TR, BL ad BR
            const distances = [];
            for (const [key, point] of Object.entries(targetPoints)) {
                if (key !== pointName) {
                    distances.push(canvas.grid.measureDistance(corners[pointName], point));
                }
            }
            const oldRange = Math.round(canvas.grid.measureDistance(activeTokenXY, targetXY));
            const range = Math.round(Math.min(...distances));
        }
    }
}