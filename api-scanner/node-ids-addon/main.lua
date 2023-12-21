local OutputBox = nil

function OutputBox_Show(text)
    -- Adapted from: https://www.wowinterface.com/forums/showpost.php?p=323901&postcount=2
    if not OutputBox then
        local f = CreateFrame("Frame", "Talent Node IDs", UIParent, "DialogBoxFrame")
        f:ClearAllPoints()
        f:SetPoint(
            "CENTER",
            nil,
            "CENTER",
            0,
            0
        )
        f:SetSize(600, 500)
        
        f:SetBackdrop({
            bgFile = "Interface\\DialogFrame\\UI-DialogBox-Background",
            edgeFile = "Interface\\PVPFrame\\UI-Character-PVP-Highlight", -- this one is neat
            edgeSize = 16,
            insets = { left = 8, right = 6, top = 8, bottom = 8 },
        })
        f:SetBackdropBorderColor(0, .44, .87, 0.5) -- darkblue
        
        -- Movable
        f:SetMovable(true)
        f:SetClampedToScreen(true)
        f:SetScript("OnMouseDown", function(self, button)
            if button == "LeftButton" then
                self:StartMoving()
            end
        end)
        f:SetScript("OnMouseUp", f.StopMovingOrSizing)
        
        -- ScrollFrame
        local sf = CreateFrame("ScrollFrame", "OutputBoxScrollFrame", f, "UIPanelScrollFrameTemplate")
        sf:SetPoint("LEFT", 16, 0)
        sf:SetPoint("RIGHT", -32, 0)
        sf:SetPoint("TOP", 0, -32)
        
        -- EditBox
        local eb = CreateFrame("EditBox", "OutputBoxEditBox", sf)
        eb:SetSize(sf:GetSize())
        eb:SetMultiLine(true)
        eb:SetAutoFocus(false) -- dont automatically focus
        eb:SetFontObject("ChatFontNormal")
        eb:SetScript("OnEscapePressed", function() f:Hide() end)
        sf:SetScrollChild(eb)
        
        -- Resizable
        f:SetResizable(true)
        f:SetResizeBounds(150, 100, nil, nil)
        
        local rb = CreateFrame("Button", "OutputBoxResizeButton", f)
        rb:SetPoint("BOTTOMRIGHT", -6, 7)
        rb:SetSize(16, 16)
        sf:SetPoint("BOTTOM", rb, "TOP", 0, 0)
        
        rb:SetNormalTexture("Interface\\ChatFrame\\UI-ChatIM-SizeGrabber-Up")
        rb:SetHighlightTexture("Interface\\ChatFrame\\UI-ChatIM-SizeGrabber-Highlight")
        rb:SetPushedTexture("Interface\\ChatFrame\\UI-ChatIM-SizeGrabber-Down")
        
        rb:SetScript("OnMouseDown", function(self, button)
            if button == "LeftButton" then
                f:StartSizing("BOTTOMRIGHT")
                self:GetHighlightTexture():Hide() -- more noticeable
            end
        end)
        rb:SetScript("OnMouseUp", function(self, button)
            f:StopMovingOrSizing()
            self:GetHighlightTexture():Show()
            eb:SetWidth(sf:GetWidth())
        end)
        OutputBox = f
    end
    
    OutputBoxEditBox:SetText(text)
    OutputBoxEditBox:HighlightText()

    OutputBox:Show()
end

local function NodeIDsCommand(msg, editbox)
    local configID = C_ClassTalents.GetActiveConfigID()
    local configInfo = C_Traits.GetConfigInfo(configID)
    local treeNodes = C_Traits.GetTreeNodes(configInfo.treeIDs[1])
    local nodes = {}

    for _, treeNodeID in ipairs(treeNodes) do
        local treeNode = C_Traits.GetNodeInfo(configID, treeNodeID);
        if treeNode.ID ~= 0 then
            nodes[#nodes+1] = treeNode
        end
    end

    local jsonNodes = {}
    for _, node in ipairs(nodes) do
        nodeText = '    {\n'
        nodeText = nodeText .. '      "id": ' .. node.ID .. ',\n'
        nodeText = nodeText .. '      "locked_by": ['
        local lockedBy = {}
        for _, edge in ipairs(node.visibleEdges) do
            if edge.type == 2 or edge.type == 3 then
                lockedBy[#lockedBy+1] = edge.targetNode
            end
        end
        nodeText = nodeText .. table.concat(lockedBy, ', ') .. '],\n'
        nodeText = nodeText .. '      "flags": ' .. node.flags .. ',\n'
        nodeText = nodeText .. '      "pos_x": ' .. node.posX .. ',\n'
        nodeText = nodeText .. '      "pos_y": ' .. node.posY .. ',\n'
        nodeText = nodeText .. '      "talent_ids": ['
        local talentIds = {}
        for _, entryID in ipairs(node.entryIDs) do
            entryInfo = C_Traits.GetEntryInfo(configID, entryID)
            talentIds[#talentIds+1] = entryInfo.definitionID
        end
        nodeText = nodeText .. table.concat(talentIds, ', ') .. ']\n'
        nodeText = nodeText .. '    }'
        jsonNodes[#jsonNodes+1] = nodeText
    end

    local className, _ = UnitClass('player')
    local specId, specName, _, _, _, _ = GetSpecializationInfo(GetSpecialization())
    local output = '{\n'
    output = output .. '  "class_name": "' .. className .. '",\n'
    output = output .. '  "class_id": ' .. configInfo.treeIDs[1] .. ',\n'
    output = output .. '  "spec_name": "' .. specName .. '",\n'
    output = output .. '  "spec_id": ' .. specId .. ',\n'
    output = output .. '  "nodes": [\n'
    output = output .. table.concat(jsonNodes, ',\n') .. '\n'
    output = output .. '  ]\n'
    output = output .. '}'
    OutputBox_Show(output)
end

SLASH_TALENT1 = '/nodes'

SlashCmdList["TALENT"] = NodeIDsCommand
