import { Cell } from '../components/base/cell'

type Node = {
    id: number,
    parent: number,
    gCost: number, // Manhattan distance from start node
    hCost: number, // Manhattan distance from target node
    fCost: number, // gCost + hCost
}

function manhattanDistance(x1: number, y1: number, x2: number, y2: number) {
    return Math.abs(x1 - x2) + Math.abs(y1 - y2)
}

function compareF(a: Node, b: Node) {
    if (a.fCost > b.fCost) return -1
    if (a.fCost < b.fCost) return 1
    return 0
}

//function checkNeighbor()

export function aStar(
    startId: number,
    targetId: number
) {
    // OPEN - the set of nodes to be evaluated
    const open: Node[] = []
    // CLOSED - the set of nodes already evaluated
    const closed: Node[] = []
    // add the start node to OPEN
    open.push({
        id: startId,
        parent: -1,
        gCost: 0,
        hCost: manhattanDistance(
            Cell.col[startId],
            Cell.row[startId],
            Cell.col[targetId],
            Cell.row[targetId]
        ),
        fCost: manhattanDistance(
            Cell.col[startId],
            Cell.row[startId],
            Cell.col[targetId],
            Cell.row[targetId]
        )
    })
    //
    // loop
    while (open.length > 0) {
        //    current = node in open with the lowest f_cost
        open.sort(compareF)
        //    remove current from OPEN
        const current = open.pop()
        //    add current to closed
        closed.push(current)
        //
        //    if current is the target node (path has been found), return
        if (current.id === targetId) break
        //
        //    foreach neighbor of the current node

        //        if neighbor is not traversable or neighbor is in CLOSED
        //            skip to the next neighbor
        //
        //        if new path to neighbor is shorter or neighbor is not in OPEN
        //            set f_cost of neighbor
        //            set parent of neighbor to current
        //            if neighbor is not in OPEN
        //                add neighbor to OPEN
    }
    return
}