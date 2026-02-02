import {
	tablerOutlineAlignCenter,
	tablerOutlineAlignJustified,
	tablerOutlineAlignLeft,
	tablerOutlineAlignRight,
	tablerOutlineArrowBackUp,
	tablerOutlineArrowForwardUp,
	tablerOutlineBold,
	tablerOutlineDeviceFloppy,
	tablerOutlineEye,
	tablerOutlineItalic,
	tablerOutlineLayoutColumns,
	tablerOutlineLink,
	tablerOutlinePencil,
	tablerOutlinePhoto,
	tablerOutlineSettings,
	tablerOutlineUnderline,
} from 'pure-glyf/icons'
import { Button } from '../components/button'
import { ButtonGroup } from '../components/buttongroup'
import { CheckButton } from '../components/checkbutton'
import { Container, Stack } from '../components/layout'
import { RadioButton } from '../components/radiobutton'
import { Toolbar } from '../components/toolbar'
import { Heading, Text } from '../components/typography'
import { stored } from '@pounce/kit'

export default () => {
	const toolbarState = stored({
		bold: false,
		italic: false,
		underline: false,
		align: 'left' as 'left' | 'center' | 'right' | 'justify',
		viewMode: 'edit' as 'edit' | 'preview' | 'split',
	})

	return (
		<Container tag="section">
			<Stack gap="lg">
				<header>
					<Heading level={1}>Toolbars</Heading>
					<Text muted>Toolbar components for grouping buttons and controls.</Text>
				</header>

				<div>
					<Heading level={3}>Basic Toolbar</Heading>
					<Toolbar>
						<Button icon={tablerOutlineDeviceFloppy}>Save</Button>
						<Button icon={tablerOutlineArrowBackUp}>Undo</Button>
						<Button icon={tablerOutlineArrowForwardUp}>Redo</Button>
						<Toolbar.Spacer />
						<Button icon={tablerOutlineSettings}>Settings</Button>
					</Toolbar>
				</div>

				<div>
					<Heading level={3}>Toolbar with CheckButtons</Heading>
					<Toolbar trapTab>
						<CheckButton
							icon={tablerOutlineBold}
							aria-label="Bold"
							checked={toolbarState.bold}
						/>
						<CheckButton
							icon={tablerOutlineItalic}
							aria-label="Italic"
							checked={toolbarState.italic}
						/>
						<CheckButton
							icon={tablerOutlineUnderline}
							aria-label="Underline"
							checked={toolbarState.underline}
						/>
						<Toolbar.Spacer visible />
						<RadioButton
							icon={tablerOutlineAlignLeft}
							aria-label="Align left"
							value="left"
							group={toolbarState.align}
						/>
						<RadioButton
							icon={tablerOutlineAlignCenter}
							aria-label="Align center"
							value="center"
							group={toolbarState.align}
						/>
						<RadioButton
							icon={tablerOutlineAlignRight}
							aria-label="Align right"
							value="right"
							group={toolbarState.align}
						/>
						<RadioButton
							icon={tablerOutlineAlignJustified}
							aria-label="Justify"
							value="justify"
							group={toolbarState.align}
						/>
						<Toolbar.Spacer />
						<RadioButton
							icon={tablerOutlinePencil}
							aria-label="Edit"
							value="edit"
							group={toolbarState.viewMode}
						/>
						<RadioButton
							icon={tablerOutlineEye}
							aria-label="Preview"
							value="preview"
							group={toolbarState.viewMode}
						/>
						<RadioButton
							icon={tablerOutlineLayoutColumns}
							aria-label="Split"
							value="split"
							group={toolbarState.viewMode}
						/>
					</Toolbar>
				</div>

				<div>
					<Heading level={3}>Icon-only Toolbar</Heading>
					<Toolbar>
						<CheckButton icon={tablerOutlineBold} aria-label="Bold" checked={toolbarState.bold} />
						<CheckButton
							icon={tablerOutlineItalic}
							aria-label="Italic"
							checked={toolbarState.italic}
						/>
						<CheckButton
							icon={tablerOutlineUnderline}
							aria-label="Underline"
							checked={toolbarState.underline}
						/>
						<Toolbar.Spacer visible />
						<Button icon={tablerOutlineLink} aria-label="Insert link" />
						<Button icon={tablerOutlinePhoto} aria-label="Insert image" />
					</Toolbar>
				</div>

				<div>
					<Heading level={3}>Vertical Toolbar</Heading>
					<Toolbar orientation="vertical" style="width: fit-content;">
						<CheckButton
							icon={tablerOutlineUnderline}
							aria-label="Underline"
							checked={toolbarState.underline}
						/>
						<Toolbar.Spacer visible />
						<Button icon={tablerOutlineLink} aria-label="Insert link" />
					</Toolbar>
				</div>

				<div>
					<Heading level={3}>ButtonGroup - Connected Buttons</Heading>
					<Toolbar>
						<ButtonGroup>
							<RadioButton
								icon={tablerOutlineAlignLeft}
								aria-label="Align left"
								value="left"
								group={toolbarState.align}
							/>
							<RadioButton
								icon={tablerOutlineAlignCenter}
								aria-label="Align center"
								value="center"
								group={toolbarState.align}
							/>
							<RadioButton
								icon={tablerOutlineAlignRight}
								aria-label="Align right"
								value="right"
								group={toolbarState.align}
							/>
						</ButtonGroup>
						<Toolbar.Spacer visible />
						<ButtonGroup>
							<CheckButton icon={tablerOutlineBold} aria-label="Bold" checked={toolbarState.bold} />
							<CheckButton
								icon={tablerOutlineItalic}
								aria-label="Italic"
								checked={toolbarState.italic}
							/>
							<CheckButton
								icon={tablerOutlineUnderline}
								aria-label="Underline"
								checked={toolbarState.underline}
							/>
						</ButtonGroup>
					</Toolbar>
				</div>
			</Stack>
		</Container>
	)
}
