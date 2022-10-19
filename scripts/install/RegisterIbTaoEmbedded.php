<?php
/**
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; under version 2
 * of the License (non-upgradable).
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 *
 * Copyright (c) 2017 (original work) Open Assessment Technologies SA;
 *
 * */

namespace oat\ibTaoEmbedded\scripts\install;

use oat\taoQtiItem\model\portableElement\action\RegisterPortableElement;

/**
 * Script to register the PCI "ibTaoEmbedded"
 *
 * Usage:
 * sudo -u www-data php index.php '\oat\ibTaoEmbedded\scripts\install\RegisterIbTaoEmbedded'
 *
 * @package oat\ibTaoEmbedded\scripts\install
 */
class RegisterIbTaoEmbedded extends RegisterPortableElement
{
    protected function getSourceDirectory(){
        $viewDir = \common_ext_ExtensionsManager::singleton()->getExtensionById('ibTaoEmbedded')->getConstant('DIR_VIEWS');
        return $viewDir.implode(DIRECTORY_SEPARATOR, ['js', 'pciCreator', 'ibTaoEmbedded']);
    }
}
