let treeCanvasScrollRestoreFrame = null;

function centerTreeOnPerson(personId = treeProjectViewState().focusPersonId)
{
    if (treeCanvasScrollRestoreFrame !== null)
    {
        cancelAnimationFrame(treeCanvasScrollRestoreFrame);
        treeCanvasScrollRestoreFrame = null;
    }
    const canvas = main.querySelector('.tree-canvas');
    const card = main.querySelector(`.tree-person-card[data-person-id="${CSS.escape(personId)}"]`);
    if (!canvas || !card) return;
    const zoom = state.treeZoom / 100;
    const cardX = Number.parseFloat(card.style.left) || 0;
    const cardY = Number.parseFloat(card.style.top) || 0;
    const cardCenterX = (cardX + TREE_CARD_W / 2) * zoom;
    const cardCenterY = (cardY + TREE_CARD_H / 2) * zoom;
    canvas.scrollLeft = Math.max(0, cardCenterX - canvas.clientWidth / 2);
    canvas.scrollTop = Math.max(0, cardCenterY - canvas.clientHeight / 2);
}

function getTreeCanvasScroll()
{
    const canvas = main.querySelector('.tree-canvas');
    if (!canvas) return null;

    return {
        left: canvas.scrollLeft,
        top: canvas.scrollTop
    };
}

function captureTreeCanvasScroll(
    projectId =
        currentFamilyTreeProjectId()
)
{
    if (!projectId)
    {
        return null;
    }

    const scroll =
        getTreeCanvasScroll();

    if (!scroll)
    {
        return null;
    }

    const view =
        treeProjectViewState(
            projectId
        );

    view.canvasScroll = {
        left:
          Math.max(
              0,
              Number(scroll.left) || 0
          ),

        top:
          Math.max(
              0,
              Number(scroll.top) || 0
          )
    };

    return view.canvasScroll;
}

function restoreTreeCanvasScroll(scroll)
{
    if (!scroll) return;

    if (treeCanvasScrollRestoreFrame !== null) cancelAnimationFrame(treeCanvasScrollRestoreFrame);
    const projectId = currentFamilyTreeProjectId();
    treeCanvasScrollRestoreFrame = requestAnimationFrame(() =>
    {
        treeCanvasScrollRestoreFrame = null;
        if (state.activeModule !== 'Family Tree' || currentFamilyTreeProjectId() !== projectId) return;
        const canvas = main.querySelector('.tree-canvas');
        if (!canvas) return;

        canvas.scrollLeft = scroll.left;
        canvas.scrollTop = scroll.top;
    });
}

