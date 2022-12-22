// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@solidstate/contracts/introspection/IERC165.sol";
import "@solidstate/contracts/token/ERC721/enumerable/IERC721Enumerable.sol";
import "@solidstate/contracts/token/ERC721/metadata/ERC721MetadataStorage.sol";
import "@solidstate/contracts/token/ERC721/metadata/IERC721Metadata.sol";
import { LibCharacter } from "./libraries/LibCharacter.sol";
import { LibDiamond } from "../shared/libraries/LibDiamond.sol";
import { IDiamondLoupe } from "../shared/interfaces/IDiamondLoupe.sol";
import { IDiamondCut } from "../shared/interfaces/IDiamondCut.sol";
import { IERC173 } from "../shared/interfaces/IERC173.sol";

contract CharacterInit {
    using ERC721MetadataStorage for ERC721MetadataStorage.Layout;

    function init(string calldata baseURI) external {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        ds.supportedInterfaces[type(IERC165).interfaceId] = true;
        ds.supportedInterfaces[type(IERC173).interfaceId] = true;
        ds.supportedInterfaces[type(IERC721Enumerable).interfaceId] = true;
        ds.supportedInterfaces[type(IERC721Metadata).interfaceId] = true;
        ds.supportedInterfaces[type(IDiamondCut).interfaceId] = true;
        ds.supportedInterfaces[type(IDiamondLoupe).interfaceId] = true;

        ERC721MetadataStorage.Layout storage ls = ERC721MetadataStorage.layout();
        ls.name = "Character";
        ls.symbol = "CHARA";
        ls.baseURI = baseURI;
    }
}
